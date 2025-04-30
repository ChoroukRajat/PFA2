from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import jwt
from users.models import User
from .models import Credentials
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
import numpy as np
import re
import os
from django.core.files.storage import default_storage
import uuid
from datetime import datetime, timezone

import pandas as pd
import io
from collections import defaultdict
import heapq
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
from .models import File

@csrf_exempt
@require_http_methods(["GET", "POST"])
def credentials(request):
    if request.method == "POST":
        # Logic for POST (add or update credentials)
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return JsonResponse({"error": "Token missing or invalid"}, status=401)

            token = auth_header.split(" ")[1]

            try:
                # Decode the token and extract user information
                payload = jwt.decode(token, 'secret', algorithms=['HS256'])
                user_id = payload.get('id')
            except jwt.ExpiredSignatureError:
                return JsonResponse({"error": "Token expired!"}, status=401)
            except jwt.DecodeError:
                return JsonResponse({"error": "Token decoding error!"}, status=401)

            # 2. Get the user object from the database
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({"error": "User not found"}, status=404)

            # 3. Parse JSON body
            try:
                data = json.loads(request.body.decode("utf-8"))
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON"}, status=400)

            # Extract credentials data
            atlas_username = data.get("atlas_username")
            atlas_password = data.get("atlas_password")
            ranger_username = data.get("ranger_username")
            ranger_password = data.get("ranger_password")

            # 4. Validate pair logic
            if (atlas_username and not atlas_password) or (atlas_password and not atlas_username):
                return JsonResponse({"error": "Both Atlas username and password must be provided together"}, status=400)

            if (ranger_username and not ranger_password) or (ranger_password and not ranger_username):
                return JsonResponse({"error": "Both Ranger username and password must be provided together"}, status=400)

            # 5. Create or update credentials
            credentials = Credentials.objects.filter(user=user).first()

            if not credentials:
                credentials = Credentials(user=user)

            if atlas_username is not None:
                credentials.atlas_username = atlas_username
            if atlas_password is not None:
                credentials.atlas_password = atlas_password
            if ranger_username is not None:
                credentials.ranger_username = ranger_username
            if ranger_password is not None:
                credentials.ranger_password = ranger_password

            credentials.save()

            return JsonResponse({
                "message": "Credentials created" if not credentials.pk else "Credentials updated"
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    elif request.method == "GET":
        # Logic for GET (get credentials)
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                raise AuthenticationFailed('Unauthenticated!')

            token = auth_header.split(" ")[1]

            try:
                # Decode the token and extract user information
                payload = jwt.decode(token, 'secret', algorithms=['HS256'])
                user_id = payload.get('id')
            except jwt.ExpiredSignatureError:
                return JsonResponse({"error": "Token expired!"}, status=401)
            except jwt.DecodeError:
                return JsonResponse({"error": "Token decoding error!"}, status=401)

            # 2. Get the user object from the database
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({"error": "User not found"}, status=404)

            # 3. Get the credentials from the database
            credentials = Credentials.objects.filter(user=user).first()

            if not credentials:
                return JsonResponse({"error": "Credentials not found"}, status=404)

            response_data = {
                "atlas_username": credentials.atlas_username,
                "atlas_password": credentials.atlas_password,
                "ranger_username": credentials.ranger_username,
                "ranger_password": credentials.ranger_password,
            }

            return JsonResponse(response_data, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


# the csv upload 
class UploadCSVView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, format=None):
        file_obj = request.FILES.get('file', None)
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Do something with the file: analyze, store, etc.
        # Example: Read as pandas DataFrame
        import pandas as pd
        import io
        df = pd.read_csv(io.StringIO(file_obj.read().decode('utf-8')))

        # Example metadata profiling
        metadata = {
            "columns": list(df.columns),
            "data_types": df.dtypes.astype(str).to_dict(),
            "missing_values": df.isnull().sum().to_dict(),
            "duplicates": df.duplicated().sum(),
            # Add outliers / normalization later
        }

        return Response({"metadata": metadata}, status=status.HTTP_200_OK)
    
class CSVMetadataView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=400)
        
        # Create unique file name and path
        original_file_name = file_obj.name
        file_id = str(uuid.uuid4())
        file_name = f"{file_id}.csv"
        file_path = os.path.join('media', 'csv_uploads', file_name)

        # Save file to disk
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)
        
        # Store file info in the File table
        #file_record = File.objects.create(
            #file_name=original_file_name,  # original name from the user
            #file_id=file_name,               # unique ID used for storing the file
            #user=request.user,             # who uploaded the file
            #date_uploaded=datetime.now(timezone.utc))

        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            return Response({'error': f'Invalid CSV: {str(e)}'}, status=400)

        columns = df.columns.tolist()
        data_types = df.dtypes.apply(lambda x: x.name).to_dict()
        missing_values = df.isnull().sum().to_dict()
        duplicates = df.duplicated().sum()

        suggested_types = {}
        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    pd.to_datetime(df[col])
                    suggested_types[col] = 'datetime'
                except:
                    suggested_types[col] = 'string'
            else:
                suggested_types[col] = df[col].dtype.name

        outliers = {}
        for col in df.select_dtypes(include=[np.number]):
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            outliers[col] = int(((df[col] < lower) | (df[col] > upper)).sum())

        normalization = {}
        for col in df.select_dtypes(include=[np.number]):
            # Skip columns that end with 'id'
            if col.endswith("id"):
                normalization[col] = "no normalization needed"
            else:
                col_data = df[col].dropna()
                if col_data.std() > 0:
                    normalization[col] = "z-score normalization suggested"
                else:
                    normalization[col] = "no normalization needed"

        regex_patterns = {
            "email": r"^[\w\.-]+@[\w\.-]+\.\w+$",
            "date": r"^\d{4}-\d{2}-\d{2}$",
            "phone": r"^\+?[0-9\-\(\) ]{7,}$",
            "postal_code": r"^\d{5}(-\d{4})?$"
        }

        pattern_detection = {}
        for col in df.columns:
            sample_values = df[col].dropna().astype(str).head(20)
            detected = []
            for label, pattern in regex_patterns.items():
                if all(re.match(pattern, val) for val in sample_values):
                    detected.append(label)
            pattern_detection[col] = detected or ["none"]

        # Semantic clustering
        semantic_clusters = {}
        text_columns = df.select_dtypes(include=['object']).columns.tolist()
        if len(text_columns) > 1:
            corpus = [" ".join(df[col].dropna().astype(str)) for col in text_columns]
            vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
            tfidf_matrix = vectorizer.fit_transform(corpus)

            if tfidf_matrix.shape[0] >= 2:
                reduced = PCA(n_components=2).fit_transform(tfidf_matrix.toarray())
                kmeans = KMeans(n_clusters=min(3, len(text_columns)), random_state=42).fit(reduced)
                labels = kmeans.labels_

                cluster_columns = defaultdict(list)
                for i, label in enumerate(labels):
                    cluster_columns[label].append(text_columns[i])

                cluster_labels = {}
                terms = vectorizer.get_feature_names_out()
                for cluster_id, cols in cluster_columns.items():
                    cluster_text = " ".join(" ".join(df[col].dropna().astype(str)) for col in cols)
                    cluster_vec = vectorizer.transform([cluster_text])
                    top_indices = heapq.nlargest(3, range(len(terms)), key=lambda i: cluster_vec[0, i])
                    top_keywords = [terms[i] for i in top_indices]
                    cluster_name = "_".join(top_keywords)
                    cluster_labels[cluster_id] = cluster_name or f"group_{cluster_id}"

                for i, col in enumerate(text_columns):
                    cluster_id = labels[i]
                    semantic_clusters[col] = cluster_labels[cluster_id]
            else:
                semantic_clusters = {col: "general_text" for col in text_columns}
        else:
            semantic_clusters = {col: "general_text" for col in text_columns}

        return Response({
            "file": {"file_name" : file_name},
            "metadata": {
                "columns": columns,
                "data_types": data_types,
                "missing_values": missing_values,
                "duplicates": duplicates,
                "suggested_data_types": suggested_types,
                "outliers": outliers,
                "normalization_suggestions": normalization,
                "pattern_detection": pattern_detection,
                "semantic_column_clusters": semantic_clusters
            }
        })
