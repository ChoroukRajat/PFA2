import json
import requests
from django.http import JsonResponse
from django.views import View
from django.conf import settings
from .models import MetadataRecommendation, HiveColumn, HiveDatabase, HiveTable
from .utils import prepare_llm_prompt_from_snapshot, fetch_all_hive_metadata, normalize_name, normalize_type
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

# @method_decorator(csrf_exempt, name='dispatch')
# class CompleteMetadataView(View):
#     def post(self, request, guid):
#         instance_column = HiveColumn.objects.filter(guid=guid).first()
#         instance_db = HiveDatabase.objects.filter(guid=guid).first()
#         instance_table = HiveTable.objects.filter(guid=guid).first()

#         if instance_column is not None:
#             instance = instance_column
#             model_class = HiveColumn
#         elif instance_db is not None:
#             instance = instance_db
#             model_class = HiveDatabase
#         else:
#             instance = instance_table
#             model_class = HiveTable

#         if instance is None:
#             return JsonResponse({"error": "No metadata found with this GUID"}, status=404)

#         prompt = prepare_llm_prompt_from_snapshot(instance)
#         print(prompt)

#         response = requests.post(
#             url="https://openrouter.ai/api/v1/chat/completions",
#             headers={
#                 "Authorization": "Bearer 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",
#                 "Content-Type": "application/json"
#             },
#             json={
#                 "model": "deepseek/deepseek-prover-v2:free",
#                 "messages": [
#                     {
#                         "role": "user",
#                         "content": prompt
#                     }
#                 ],
#             }
#         )

#         llm_data = response.json()
#         try:
#             suggestion_str = llm_data['choices'][0]['message']['content']

#             # Remove code block markdown if present
#             cleaned = re.sub(r"```json|```", "", suggestion_str).strip()

#             # Find the first '{' which indicates start of JSON object
#             json_start = cleaned.find('{')
#             if json_start == -1:
#                 raise ValueError("No JSON object found in the LLM response.")

#             json_str = cleaned[json_start:]

#             # Parse JSON safely
#             suggestions = json.loads(json_str)

#             saved = []
#             for field, value in suggestions.items():
#                 rec = MetadataRecommendation.objects.create(
#                     snapshot=instance,
#                     field=field,
#                     suggested_value=value,
#                     status='pending'
#                 )
#                 saved.append({"field": field, "value": value})

#             return JsonResponse({"recommendations": saved})

#         except Exception as e:
#             return JsonResponse({
#                 "error": "Failed to parse LLM response",
#                 "details": str(e),
#                 "raw": suggestion_str
#             }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class CompleteMetadataView(View):
    def post(self, request, guid):
        instance_column = HiveColumn.objects.filter(guid=guid).first()
        instance_db = HiveDatabase.objects.filter(guid=guid).first()
        instance_table = HiveTable.objects.filter(guid=guid).first()

        if instance_column:
            instance = instance_column
        elif instance_db:
            instance = instance_db
        else:
            instance = instance_table

        prompt = prepare_llm_prompt_from_snapshot(instance)
        

        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": "Bearer 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",
                "Content-Type": "application/json"
            },
            data=json.dumps({
                "model": "deepseek/deepseek-prover-v2:free",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
            })
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

            # Now add uniformized name and type suggestions
            if hasattr(instance, 'name'):
                suggestions['name'] = normalize_name(instance.name)
            if hasattr(instance, 'type'):
                suggestions['type'] = normalize_type(instance.type)

            saved = []
            for field, value in suggestions.items():
                rec = MetadataRecommendation.objects.create(
                    snapshot=instance,   # or your snapshot instance
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


from django.core.exceptions import ObjectDoesNotExist

# class LLMSuggestionsFromColumns(APIView):

#     def post(self, request):
#         qualified_names = request.data.get("qualified_names", [])
#         if not qualified_names:
#             return Response({"error": "No qualified_names provided."}, status=400)

#         metadata_list = []
#         for qn in qualified_names:
#             try:
#                 column = HiveColumn.objects.get(qualified_name=qn)
#                 metadata_list.append({
#                     "qualified_name": column.qualified_name,
#                     "name": column.name,
#                     "type": column.type,
#                     "table": column.table_name,
#                     "description": column.description or ""
#                 })
#             except ObjectDoesNotExist:
#                 return Response({"error": f"Column with qualified_name '{qn}' not found."}, status=404)

#         # Build the LLM prompt
#         prompt = self.build_prompt(metadata_list)

#         try:
#             response = requests.post(
#                 url="https://openrouter.ai/api/v1/chat/completions",
#                 headers={
#                     "Authorization": "Bearer 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",
#                     "Content-Type": "application/json"
#                 },
#                 data=json.dumps({
#                     "model": "deepseek/deepseek-chat-v3-0324:free",
#                     "messages": [
#                         {"role": "user", "content": prompt}
#                     ]
#                 })
#             )

#             if response.status_code != 200:
#                 return Response({
#                     "error": "LLM call failed",
#                     "details": response.text
#                 }, status=response.status_code)

#             completion = response.json()
#             raw_content = completion["choices"][0]["message"]["content"]

#             # Extract JSON code block using regex
#             json_match = re.search(r"```json\s*(\{.*?\})\s*```", raw_content, re.DOTALL)
#             if json_match:
#                 json_str = json_match.group(1)
#                 suggestions = json.loads(json_str)
#                 return Response(suggestions)
#             else:
#                 return Response({"error": "No valid JSON block found in LLM response."}, status=500)

#         except Exception as e:
#             return Response({"error": "LLM call failed", "details": str(e)}, status=500)

#     def build_prompt(self, columns_metadata):
#         prompt = (
#             "You are a metadata governance assistant.\n"
#             "For each column, suggest relevant business tags and identify any potential relationships between columns.\n\n"
#             "Return a JSON in this format:\n"
#             "{\n"
#             "  \"tags\": {\n"
#             "    \"qualified_name\": [\"Tag1\", \"Tag2\"]\n"
#             "  },\n"
#             "  \"relationships\": [\n"
#             "    {\"from\": \"qualified_name1\", \"to\": \"qualified_name2\", \"type\": \"relationship_type\"}\n"
#             "  ]\n"
#             "}\n\n"
#             "Here is the metadata:\n"
#         )

#         for col in columns_metadata:
#             prompt += (
#                 f"- Qualified Name: {col['qualified_name']}\n"
#                 f"  Name: {col['name']}\n"
#                 f"  Type: {col['type']}\n"
#                 f"  Table: {col['table']}\n"
#                 f"  Description: {col['description']}\n\n"
#             )

#         return prompt


class LLMSuggestionsFromColumns(APIView):

    def post(self, request):
        qualified_names = request.data.get("qualified_names", [])
        if not qualified_names:
            return Response({"error": "No qualified_names provided."}, status=400)

        metadata_list = []
        for qn in qualified_names:
            try:
                column = HiveColumn.objects.get(qualified_name=qn)
                metadata_list.append({
                    "qualified_name": column.qualified_name,
                    "name": column.name,
                    "type": column.type,
                    "table": column.table_name,
                    "description": column.description or ""
                })
            except ObjectDoesNotExist:
                return Response({"error": f"Column with qualified_name '{qn}' not found."}, status=404)

        prompt = self.build_prompt(metadata_list)

        try:
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": "Bearer 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",
                    "Content-Type": "application/json"
                },
                data=json.dumps({
                    "model": "deepseek/deepseek-prover-v2:free",
                    "messages": [{"role": "user", "content": prompt}]
                })
            )

            if response.status_code != 200:
                return Response({"error": "LLM call failed", "details": response.text}, status=response.status_code)

            raw_content = response.json()["choices"][0]["message"]["content"]
            json_match = re.search(r"```json\s*(\{.*?\})\s*```", raw_content, re.DOTALL)

            if not json_match:
                return Response({"error": "No valid JSON block found in LLM response."}, status=500)

            suggestions = json.loads(json_match.group(1))
            self.save_tags(suggestions.get("tags", {}))
            self.save_relationships(suggestions.get("relationships", []))

            return Response(suggestions)

        except Exception as e:
            return Response({"error": "LLM call failed", "details": str(e)}, status=500)

    def build_prompt(self, columns_metadata):
        prompt = (
            "You are a metadata governance assistant.\n"
            "For each column, suggest relevant business tags and identify any potential relationships between columns.\n\n"
            "Return a JSON in this format:\n"
            "{\n"
            "  \"tags\": {\n"
            "    \"qualified_name\": [\"Tag1\", \"Tag2\"]\n"
            "  },\n"
            "  \"relationships\": [\n"
            "    {\"from\": \"qualified_name1\", \"to\": \"qualified_name2\", \"type\": \"relationship_type\"}\n"
            "  ]\n"
            "}\n\n"
            "Here is the metadata:\n"
        )

        for col in columns_metadata:
            prompt += (
                f"- Qualified Name: {col['qualified_name']}\n"
                f"  Name: {col['name']}\n"
                f"  Type: {col['type']}\n"
                f"  Table: {col['table']}\n"
                f"  Description: {col['description']}\n\n"
            )
        return prompt

    def save_tags(self, tag_map):
        ct = ContentType.objects.get_for_model(HiveColumn)
        for qualified_name, tags in tag_map.items():
            try:
                column = HiveColumn.objects.get(qualified_name=qualified_name)
                for tag in tags:
                    MetadataRecommendation.objects.create(
                        content_type=ct,
                        object_id=column.id,
                        field="tags",
                        suggested_value=tag,
                        confidence=None,
                        status="pending"
                    )
            except HiveColumn.DoesNotExist:
                continue

    def save_relationships(self, relationships):
        ct = ContentType.objects.get_for_model(HiveColumn)

        for rel in relationships:
            try:
                source = HiveColumn.objects.get(qualified_name=rel["from"])
                target = HiveColumn.objects.get(qualified_name=rel["to"])
                relation_type = rel.get("type", "related")

                # Save recommendation for the source
                MetadataRecommendation.objects.create(
                    content_type=ct,
                    object_id=source.id,
                    field="relationship",
                    suggested_value=f"{relation_type} → {target.qualified_name}",
                    confidence=None,
                    status="pending"
                )

                # Optionally: Save reverse recommendation for the target
                MetadataRecommendation.objects.create(
                    content_type=ct,
                    object_id=target.id,
                    field="relationship",
                    suggested_value=f"{relation_type} ← {source.qualified_name}",
                    confidence=None,
                    status="pending"
                )

            except HiveColumn.DoesNotExist:
                continue



# class LLMClassificationAndRetention(APIView):
#     def post(self, request):
#         qualified_names = request.data.get("qualified_names", [])
#         if not qualified_names:
#             return Response({"error": "No qualified_names provided."}, status=400)

#         metadata_list = []
#         for qn in qualified_names:
#             try:
#                 column = HiveColumn.objects.get(qualified_name=qn)
#                 table = HiveTable.objects.get(guid=column.table_guid)
#                 metadata_list.append({
#                     "qualified_name": column.qualified_name,
#                     "name": column.name,
#                     "type": column.type,
#                     "description": column.description or "",
#                     "table_name": table.name,
#                     "table_description": table.description or "",
#                     "table_retention": table.retention_period
#                 })
#             except HiveColumn.DoesNotExist:
#                 return Response({"error": f"Column '{qn}' not found."}, status=404)
#             except HiveTable.DoesNotExist:
#                 return Response({"error": f"Table for column '{qn}' not found."}, status=404)

#         prompt = self.build_prompt(metadata_list)

#         try:
#             response = requests.post(
#                 url="https://openrouter.ai/api/v1/chat/completions",
#                 headers={
#                     "Authorization": f"Bearer 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",
#                     "Content-Type": "application/json"
#                 },
#                 data=json.dumps({
#                     "model": "deepseek/deepseek-prover-v2:free",
#                     "messages": [{"role": "user", "content": prompt}]
#                 })
#             )

#             if response.status_code != 200:
#                 return Response({"error": "LLM call failed", "details": response.text}, status=response.status_code)

#             content = response.json()["choices"][0]["message"]["content"]
#             json_block = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
#             if not json_block:
#                 return Response({"error": "No valid JSON block found in LLM response."}, status=500)

#             suggestions = json.loads(json_block.group(1))
#             self.save_classification_recommendations(suggestions.get("classifications", {}))
#             self.save_retention_recommendations(suggestions.get("retention", {}))
#             return Response(suggestions)

#         except Exception as e:
#             return Response({"error": "LLM call failed", "details": str(e)}, status=500)

#     def build_prompt(self, metadata_list):
#         prompt = (
#             "You are a metadata governance expert.\n"
#             "For each column, suggest whether it is public, sensitive, or critical.\n"
#             "If the table retention_period is null, suggest a suitable retention period in days based on the column types and table description.\n"
#             "Return a JSON like this:\n"
#             "{\n"
#             "  \"classifications\": {\n"
#             "    \"qualified_name1\": \"sensitive\",\n"
#             "    \"qualified_name2\": \"critical\"\n"
#             "  },\n"
#             "  \"retention\": {\n"
#             "    \"table_name1\": 180,\n"
#             "    \"table_name2\": 365\n"
#             "  }\n"
#             "}\n\n"
#             "Here is the metadata:\n"
#         )
#         for md in metadata_list:
#             prompt += (
#                 f"- Qualified Name: {md['qualified_name']}\n"
#                 f"  Name: {md['name']}\n"
#                 f"  Type: {md['type']}\n"
#                 f"  Description: {md['description']}\n"
#                 f"  Table: {md['table_name']}\n"
#                 f"  Table Description: {md['table_description']}\n"
#                 f"  Retention Period: {md['table_retention']}\n\n"
#             )
#         return prompt

#     def save_classification_recommendations(self, classification_map):
#         ct = ContentType.objects.get_for_model(HiveColumn)
#         for qualified_name, label in classification_map.items():
#             try:
#                 column = HiveColumn.objects.get(qualified_name=qualified_name)
#                 MetadataRecommendation.objects.create(
#                     content_type=ct,
#                     object_id=column.id,
#                     field="classifications",
#                     suggested_value=label,
#                     confidence=None,
#                     status="pending"
#                 )
#             except HiveColumn.DoesNotExist:
#                 continue

#     def save_retention_recommendations(self, retention_map):
#         ct = ContentType.objects.get_for_model(HiveTable)
#         for table_name, retention_days in retention_map.items():
#             try:
#                 table = HiveTable.objects.get(name=table_name)
#                 if table.retention_period is None:
#                     MetadataRecommendation.objects.create(
#                         content_type=ct,
#                         object_id=table.id,
#                         field="retention_period",
#                         suggested_value=str(retention_days),
#                         confidence=None,
#                         status="pending"
#                     )
#             except HiveTable.DoesNotExist:
#                 continue

class LLMClassificationAndRetention(APIView):
    def post(self, request):
        qualified_names = request.data.get("qualified_names", [])
        if not qualified_names:
            return Response({"error": "No qualified_names provided."}, status=400)

        metadata_list = []
        for qn in qualified_names:
            try:
                # Try finding it as a HiveColumn first
                column = HiveColumn.objects.get(qualified_name=qn)
                table = HiveTable.objects.get(guid=column.table_guid)
                metadata_list.append({
                    "qualified_name": column.qualified_name,
                    "name": column.name,
                    "type": column.type,
                    "description": column.description or "",
                    "table_name": table.name,
                    "table_description": table.description or "",
                    "table_retention": table.retention_period
                })

            except HiveColumn.DoesNotExist:
                # If not a column, check if it's a HiveTable
                try:
                    table = HiveTable.objects.get(qualified_name=qn)
                    metadata_list.append({
                        "qualified_name": table.qualified_name,
                        "name": table.name,
                        "type": "table",  
                        "description": table.description or "",
                        "table_name": table.name,
                        "table_description": table.description or "",
                        "table_retention": table.retention_period
                    })
                except HiveTable.DoesNotExist:
                    return Response({"error": f"Neither column nor table found for '{qn}'."}, status=404)

        prompt = self.build_prompt(metadata_list)

        try:
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer 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",
                    "Content-Type": "application/json"
                },
                data=json.dumps({
                    "model": "deepseek/deepseek-prover-v2:free",
                    "messages": [{"role": "user", "content": prompt}]
                })
            )

            if response.status_code != 200:
                return Response({"error": "LLM call failed", "details": response.text}, status=response.status_code)

            content = response.json()["choices"][0]["message"]["content"]
            json_block = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
            if not json_block:
                return Response({"error": "No valid JSON block found in LLM response."}, status=500)

            suggestions = json.loads(json_block.group(1))
            self.save_classification_recommendations(suggestions.get("classifications", {}))
            self.save_retention_recommendations(suggestions.get("retention", {}))
            return Response(suggestions)

        except Exception as e:
            return Response({"error": "LLM call failed", "details": str(e)}, status=500)

    def build_prompt(self, metadata_list):
        prompt = (
            "You are a metadata governance expert.\n"
            "For each column or table, suggest whether it is public, sensitive, or critical.\n"
            "If a table retention_period is null, suggest a suitable retention period in days based on the column types and table description.\n"
            "Return a JSON like this:\n"
            "{\n"
            "  \"classifications\": {\n"
            "    \"qualified_name1\": \"sensitive\",\n"
            "    \"qualified_name2\": \"critical\"\n"
            "  },\n"
            "  \"retention\": {\n"
            "    \"table_name1\": 180,\n"
            "    \"table_name2\": 365\n"
            "  }\n"
            "}\n\n"
            "Here is the metadata:\n"
        )
        for md in metadata_list:
            prompt += (
                f"- Qualified Name: {md['qualified_name']}\n"
                f"  Name: {md['name']}\n"
                f"  Type: {md['type']}\n"
                f"  Description: {md['description']}\n"
                f"  Table: {md['table_name']}\n"
                f"  Table Description: {md['table_description']}\n"
                f"  Retention Period: {md['table_retention']}\n\n"
            )
        return prompt

    def save_classification_recommendations(self, classification_map):
        ct_column = ContentType.objects.get_for_model(HiveColumn)
        ct_table = ContentType.objects.get_for_model(HiveTable)

        for qualified_name, label in classification_map.items():
            # Try column first
            try:
                column = HiveColumn.objects.get(qualified_name=qualified_name)
                MetadataRecommendation.objects.create(
                    content_type=ct_column,
                    object_id=column.id,
                    field="classifications",
                    suggested_value=label,
                    confidence=None,
                    status="pending"
                )
                continue  # Skip to next item once saved for column
            except HiveColumn.DoesNotExist:
                pass

            # If not a column, try table
            try:
                table = HiveTable.objects.get(qualified_name=qualified_name)
                MetadataRecommendation.objects.create(
                    content_type=ct_table,
                    object_id=table.id,
                    field="classifications",
                    suggested_value=label,
                    confidence=None,
                    status="pending"
                )
            except HiveTable.DoesNotExist:
                # You may want to log or handle the missing item here
                continue

    def save_retention_recommendations(self, retention_map):
        ct = ContentType.objects.get_for_model(HiveTable)
        for table_name, retention_days in retention_map.items():
            try:
                table = HiveTable.objects.get(name=table_name)
                if table.retention_period is None:
                    MetadataRecommendation.objects.create(
                        content_type=ct,
                        object_id=table.id,
                        field="retention_period",
                        suggested_value=str(retention_days),
                        confidence=None,
                        status="pending"
                    )
            except HiveTable.DoesNotExist:
                continue

from django.shortcuts import get_object_or_404
class HiveDatabaseListView(APIView):
    def get(self, request):
        databases = HiveDatabase.objects.all().values(
            'guid', 'name', 'qualified_name', 'description', 'owner'
        )
        return Response({
            'databases': list(databases)
        }, status=status.HTTP_200_OK)

class HiveDatabaseDetailView(APIView):
    def get(self, request, db_guid):
        db = get_object_or_404(HiveDatabase, guid=db_guid)
        
        # Convert create_time and update_time to readable format
        from datetime import datetime
        create_time = datetime.fromtimestamp(db.create_time/1000).strftime('%Y-%m-%d %H:%M:%S') if db.create_time else None
        update_time = datetime.fromtimestamp(db.update_time/1000).strftime('%Y-%m-%d %H:%M:%S') if db.update_time else None
        
        # Parse full_json if it exists
        full_json = db.full_json if db.full_json else {}
        
        response_data = {
            'guid': db.guid,
            'name': db.name,
            'qualified_name': db.qualified_name,
            'location': db.location,
            'owner': db.owner,
            'description': db.description,
            'created_by': db.created_by,
            'updated_by': db.updated_by,
            'create_time': create_time,
            'update_time': update_time,
            'metadata': {
                'classifications': None,
                'full_json': full_json
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)

class HiveTableListView(APIView):
    def get(self, request, db_guid):
        tables = HiveTable.objects.filter(db_guid=db_guid).values(
            'guid', 'name', 'qualified_name', 'description', 'table_type', 'owner'
        )
        return Response({
            'tables': list(tables)
        }, status=status.HTTP_200_OK)

class HiveTableDetailView(APIView):
    def get(self, request, table_guid):
        table = get_object_or_404(HiveTable, guid=table_guid)
        
        from datetime import datetime
        create_time = datetime.fromtimestamp(table.create_time/1000).strftime('%Y-%m-%d %H:%M:%S') if table.create_time else None
        
        response_data = {
            'guid': table.guid,
            'name': table.name,
            'qualified_name': table.qualified_name,
            'owner': table.owner,
            'description': table.description,
            'temporary': table.temporary,
            'table_type': table.table_type,
            'db_guid': table.db_guid,
            'db_name': table.db_name,
            'created_by': table.created_by,
            'updated_by': table.updated_by,
            'create_time': create_time,
            'retention_period': table.retention_period,
            'metadata': {
                'classifications': table.classifications if table.classifications else None,
                'full_json': table.full_json if table.full_json else {}
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)

class HiveColumnListView(APIView):
    def get(self, request, table_guid):
        columns = HiveColumn.objects.filter(table_guid=table_guid).values(
            'guid', 'name', 'qualified_name', 'description', 'type', 'position', 'owner'
        )
        return Response({
            'columns': list(columns)
        }, status=status.HTTP_200_OK)

class HiveColumnDetailView(APIView):
    def get(self, request, column_guid):
        column = get_object_or_404(HiveColumn, guid=column_guid)
        
        from datetime import datetime
        create_time = datetime.fromtimestamp(column.create_time/1000).strftime('%Y-%m-%d %H:%M:%S') if column.create_time else None
        update_time = datetime.fromtimestamp(column.update_time/1000).strftime('%Y-%m-%d %H:%M:%S') if column.update_time else None
        
        response_data = {
            'guid': column.guid,
            'name': column.name,
            'qualified_name': column.qualified_name,
            'type': column.type,
            'position': column.position,
            'owner': column.owner,
            'description': column.description,
            'table_guid': column.table_guid,
            'table_name': column.table_name,
            'created_by': column.created_by,
            'updated_by': column.updated_by,
            'create_time': create_time,
            'update_time': update_time,
            'metadata': {
                'classifications': column.classifications if column.classifications else None,
                'full_json': column.full_json if column.full_json else {}
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)

class MetadataRecommendationQualityListView(APIView):
    def get(self, request):
        guid = request.query_params.get('guid', None)
        if not guid:
            return Response(
                {"error": "guid parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        column = get_object_or_404(HiveColumn, guid=guid)
        content_type = ContentType.objects.get_for_model(HiveColumn)

        from .models import MetadataRecommendation

        # Target fields
        target_fields = ['description', 'name', 'type', 'owner']
        latest_recommendations = []

        for field in target_fields:
            latest = (
                MetadataRecommendation.objects
                .filter(
                    content_type=content_type,
                    object_id=column.id,
                    field=field
                )
                .order_by('-created_at')
                .values(
                    'id', 'field', 'suggested_value', 'confidence', 'status', 'created_at'
                )
                .first()
            )
            if latest:
                latest_recommendations.append(latest)

        return Response(latest_recommendations, status=status.HTTP_200_OK)

