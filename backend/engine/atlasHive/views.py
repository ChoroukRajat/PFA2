from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
import jwt
from users.models import User
from .services.atlas_service import AtlasService

class HiveDatabaseView(APIView):
    def get(self, request):
        # Authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except Exception as e:
            raise AuthenticationFailed('Invalid token!')

        # Get data
        atlas_service = AtlasService(user)
        databases = atlas_service.get_all_databases()
        
        return Response({
            'databases': databases
        })

class HiveTableView(APIView):
    def get(self, request, db_name):
        # Authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except Exception as e:
            raise AuthenticationFailed('Invalid token!')

        # Get data
        atlas_service = AtlasService(user)
        tables = atlas_service.get_tables_for_database(db_name)
        
        return Response({
            'tables': tables
        })

class HiveColumnView(APIView):
    def get(self, request, table_name):
        # Authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except Exception as e:
            raise AuthenticationFailed('Invalid token!')

        # Get data
        atlas_service = AtlasService(user)
        columns = atlas_service.get_columns_for_table(table_name)
        
        return Response({
            'columns': columns
        })

class GlossaryView(APIView):
    def get(self, request):
        # Authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except Exception as e:
            raise AuthenticationFailed('Invalid token!')

        # Get data
        atlas_service = AtlasService(user)
        terms = atlas_service.get_glossary_terms()
        
        return Response({
            'terms': terms
        })

class MetadataHierarchyView(APIView):
    def get(self, request):
        # Authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except Exception as e:
            raise AuthenticationFailed('Invalid token!')

        # Get data
        atlas_service = AtlasService(user)
        hierarchy = atlas_service.get_full_metadata_hierarchy()
        
        return Response(hierarchy)