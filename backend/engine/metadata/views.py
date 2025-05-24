import json
import requests
from django.http import JsonResponse
from django.views import View
from django.conf import settings
from .models import MetadataRecommendation, HiveColumn, HiveDatabase, HiveTable
from .utils import prepare_llm_prompt_from_snapshot, fetch_all_hive_metadata
from pyapacheatlas.auth import BasicAuthentication
from pyapacheatlas.core import AtlasClient, AtlasEntity
from rest_framework.views import APIView
from rest_framework.response import Response
from atlasHive.services.atlas_service import AtlasService
from rest_framework.exceptions import AuthenticationFailed
import jwt
from users.models import User
from rest_framework import status





from django.contrib.contenttypes.models import ContentType
from django.views import View
from django.http import JsonResponse
from django.conf import settings
import json
import requests
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import re

@method_decorator(csrf_exempt, name='dispatch')
class CompleteMetadataView(View):
    def post(self, request, guid):
        instance_column = HiveColumn.objects.filter(guid=guid).first()
        instance_db = HiveDatabase.objects.filter(guid=guid).first()
        instance_table = HiveTable.objects.filter(guid=guid).first()

        if instance_column is not None:
            instance = instance_column
            model_class = HiveColumn
        elif instance_db is not None:
            instance = instance_db
            model_class = HiveDatabase
        else:
            instance = instance_table
            model_class = HiveTable

        if instance is None:
            return JsonResponse({"error": "No metadata found with this GUID"}, status=404)

        prompt = prepare_llm_prompt_from_snapshot(instance)
        print(prompt)

        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": "Bearer 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",
                "Content-Type": "application/json"
            },
            json={
                "model": "deepseek/deepseek-prover-v2:free",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
            }
        )

        llm_data = response.json()
        try:
            suggestion_str = llm_data['choices'][0]['message']['content']

            # Remove code block markdown if present
            cleaned = re.sub(r"```json|```", "", suggestion_str).strip()

            # Find the first '{' which indicates start of JSON object
            json_start = cleaned.find('{')
            if json_start == -1:
                raise ValueError("No JSON object found in the LLM response.")

            json_str = cleaned[json_start:]

            # Parse JSON safely
            suggestions = json.loads(json_str)

            saved = []
            for field, value in suggestions.items():
                rec = MetadataRecommendation.objects.create(
                    snapshot=instance,
                    field=field,
                    suggested_value=value,
                    status='pending'
                )
                saved.append({"field": field, "value": value})

            return JsonResponse({"recommendations": saved})

        except Exception as e:
            return JsonResponse({
                "error": "Failed to parse LLM response",
                "details": str(e),
                "raw": suggestion_str
            }, status=500)

class UpdateRecommendationStatusView(View):
    def post(self, request, rec_id):
        try:
            rec = MetadataRecommendation.objects.get(id=rec_id, snapshot__user=request.user)
        except MetadataRecommendation.DoesNotExist:
            return JsonResponse({"error": "Recommendation not found"}, status=404)

        data = json.loads(request.body)
        status = data.get("status")
        if status not in ['accepted', 'rejected']:
            return JsonResponse({"error": "Invalid status"}, status=400)

        rec.status = status
        rec.save()
        return JsonResponse({"message": f"Status updated to {status}"})


class FetchHiveMetadataAPIView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')
        print("Auth Header:", auth_header)

        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')

        token = auth_header.split(" ")[1]
        print("Token:", token)

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')

        user = User.objects.filter(id=payload['id']).first()
        try:
            client = AtlasService(user)
            fetch_all_hive_metadata(client)
            return Response({'status': 'success', 'message': 'Hive metadata fetched and stored.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
