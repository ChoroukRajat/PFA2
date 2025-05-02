import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from core.models import Credentials
from .models import AtlasEntity, AnnotationCategory, PendingAnnotation, ApprovedAnnotation
from users.models import User
import base64
import json
import jwt
from rest_framework.exceptions import AuthenticationFailed

class AtlasSearchView(APIView):
    def get(self, request, entity_type):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')

        user = User.objects.filter(id=payload['id']).first()
        credentials = get_object_or_404(Credentials, user=user)
        
        if not credentials.atlas_username or not credentials.atlas_password:
            return Response({"error": "Atlas credentials not configured"}, status=status.HTTP_400_BAD_REQUEST)
        
        auth_string = f"{credentials.atlas_username}:{credentials.atlas_password}"
        auth_token = base64.b64encode(auth_string.encode()).decode()
        headers = {
            "Authorization": f"Basic {auth_token}",
            "Content-Type": "application/json"
        }
        
        # Build the query based on entity type
        if entity_type == 'hive_db':
            query = "from hive_db"
        elif entity_type == 'hive_table':
            table_name = request.query_params.get('name', '')
            query = f"from hive_table where name = '{table_name}'"
        else:
            return Response({"error": "Invalid entity type"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            response = requests.get(
                "http://192.168.164.131:21000/api/atlas/v2/search/dsl",
                params={"query": query},
                headers=headers
            )
            response.raise_for_status()
            
            # Process and store entities
            entities = response.json().get('entities', [])
            simplified_entities = []
            
            for entity in entities:
                # Store or update entity in our database
                defaults = {
                    'type_name': entity.get('typeName'),
                    'name': entity.get('attributes', {}).get('name'),
                    'qualified_name': entity.get('attributes', {}).get('qualifiedName'),
                    'raw_data': entity
                }
                AtlasEntity.objects.update_or_create(
                    guid=entity.get('guid'),
                    defaults=defaults
                )
                
                # Prepare simplified response
                simplified_entities.append({
                    'guid': entity.get('guid'),
                    'type': entity.get('typeName'),
                    'name': entity.get('attributes', {}).get('name'),
                    'qualified_name': entity.get('attributes', {}).get('qualifiedName')
                })
            
            return Response({"entities": simplified_entities})
            
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GlossaryView(APIView):
    def get(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')

        user = User.objects.filter(id=payload['id']).first()
        credentials = get_object_or_404(Credentials, user=user)
        
        if not credentials.atlas_username or not credentials.atlas_password:
            return Response({"error": "Atlas credentials not configured"}, status=status.HTTP_400_BAD_REQUEST)
        
        auth_string = f"{credentials.atlas_username}:{credentials.atlas_password}"
        auth_token = base64.b64encode(auth_string.encode()).decode()
        headers = {
            "Authorization": f"Basic {auth_token}",
            "Content-Type": "application/json"
        }
        
        try:
            # Get all glossaries
            response = requests.get(
                "http://192.168.164.131:21000/api/atlas/v2/glossary",
                headers=headers
            )
            response.raise_for_status()
            
            glossaries = response.json()
            
            # For each glossary, get terms
            glossary_terms = []
            for glossary in glossaries:
                glossary_id = glossary.get('guid')
                terms_response = requests.get(
                    f"http://192.168.164.131:21000/api/atlas/v2/glossary/{glossary_id}/terms",
                    headers=headers
                )
                terms_response.raise_for_status()
                
                terms = terms_response.json()
                glossary_terms.append({
                    'glossary_id': glossary_id,
                    'glossary_name': glossary.get('name'),
                    'terms': terms
                })
                
                # Sync categories with our database
                for term in terms:
                    AnnotationCategory.objects.get_or_create(
                        glossary_id=term.get('guid'),
                        defaults={
                            'user': user,
                            'label': term.get('name')
                        }
                    )
            
            return Response({"glossaries": glossary_terms})
            
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AnnotationView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')

        user = User.objects.filter(id=payload['id']).first()
        data = request.data
        
        # Validate required fields
        required_fields = ['entity_guid', 'category_id', 'proposed_changes']
        if not all(field in data for field in required_fields):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            entity = AtlasEntity.objects.get(guid=data['entity_guid'])
            category = AnnotationCategory.objects.get(id=data['category_id'])
            
            # Create or update pending annotation
            annotation, created = PendingAnnotation.objects.update_or_create(
                entity=entity,
                user=user,
                category=category,
                defaults={
                    'comment': data.get('comment', ''),
                    'proposed_changes': data['proposed_changes'],
                    'status': 'PENDING'
                }
            )
            
            return Response({
                "status": "success",
                "annotation_id": annotation.id,
                "created": created
            })
            
        except AtlasEntity.DoesNotExist:
            return Response({"error": "Entity not found"}, status=status.HTTP_404_NOT_FOUND)
        except AnnotationCategory.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ApproveAnnotationView(APIView):
    def post(self, request, annotation_id):
        # Only data stewards should be able to access this
        if not request.user.role == 'DATA_STEWARD':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            pending_annotation = PendingAnnotation.objects.get(id=annotation_id)
            
            # Create approved annotation
            approved_annotation = ApprovedAnnotation.objects.create(
                original_request=pending_annotation,
                approved_by=request.user
            )
            
            # Update pending annotation status
            pending_annotation.status = 'APPROVED'
            pending_annotation.save()
            
            # TODO: Add logic to sync with Atlas using pyapacheatlas
            
            return Response({
                "status": "success",
                "approved_id": approved_annotation.id
            })
            
        except PendingAnnotation.DoesNotExist:
            return Response({"error": "Annotation not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RejectAnnotationView(APIView):
    def post(self, request, annotation_id):
        # Only data stewards should be able to access this
        if not request.user.role == 'DATA_STEWARD':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            pending_annotation = PendingAnnotation.objects.get(id=annotation_id)
            pending_annotation.status = 'REJECTED'
            pending_annotation.save()
            
            return Response({
                "status": "success",
                "message": "Annotation rejected"
            })
            
        except PendingAnnotation.DoesNotExist:
            return Response({"error": "Annotation not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserAnnotationsView(APIView):
    def get(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')

        user = User.objects.filter(id=payload['id']).first()
        status_filter = request.query_params.get('status', None)
        
        queryset = PendingAnnotation.objects.filter(user=user)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        annotations = []
        for annotation in queryset:
            annotations.append({
                'id': annotation.id,
                'entity': {
                    'guid': annotation.entity.guid,
                    'name': annotation.entity.name,
                    'type': annotation.entity.type_name
                },
                'category': annotation.category.label,
                'comment': annotation.comment,
                'proposed_changes': annotation.proposed_changes,
                'status': annotation.status,
                'date_created': annotation.date_created
            })
        
        return Response({"annotations": annotations})