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

class CompleteMetadataView(View):
    def post(self, request, entity_type, guid):
        try:
            model_class = {
                'hivecolumn': HiveColumn,
                'hivetable': HiveTable,
                'hivedatabase': HiveDatabase
            }.get(entity_type.lower())

            if not model_class:
                return JsonResponse({"error": "Invalid entity type"}, status=400)

            instance = model_class.objects.get(guid=guid)

        except model_class.DoesNotExist:
            return JsonResponse({"error": "Metadata not found"}, status=404)

        prompt = prepare_llm_prompt_from_snapshot(instance)

        response = requests.post(
            "https://api.endpoints.anyscale.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.LLM_API_KEY}"},
            json={
                "model": "deepseek/deepseek-prover-v2:free",
                "messages": [{"role": "user", "content": prompt}]
            }
        )

        llm_data = response.json()
        try:
            suggestion_str = llm_data['choices'][0]['message']['content']
            suggestions = json.loads(suggestion_str)

            content_type = ContentType.objects.get_for_model(model_class)

            saved = []
            for field, value in suggestions.items():
                rec = MetadataRecommendation.objects.create(
                    content_type=content_type,
                    object_id=instance.id,
                    field=field,
                    suggested_value=value,
                    status='pending'
                )
                saved.append({"field": field, "value": value})

            return JsonResponse({"recommendations": saved})

        except Exception as e:
            return JsonResponse({"error": "Failed to parse LLM response", "details": str(e)}, status=500)


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
