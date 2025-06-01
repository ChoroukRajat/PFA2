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


from rest_framework import generics
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError

from .models import PersonalGlossary, PersonalGlossaryTerm, PersonalAnnotation, Annotation
from .serializers import *

class PersonalGlossaryListCreateView(generics.ListCreateAPIView):
    serializer_class = PersonalGlossarySerializer

    def get_queryset(self):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except:
            return
        return PersonalGlossary.objects.filter(user=user)

    def perform_create(self, serializer):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except:
            return
        serializer.save(user=user)

class PersonalGlossaryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PersonalGlossarySerializer
    

    def get_queryset(self):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except:
            return
        return PersonalGlossary.objects.filter(user=user)

class PersonalGlossaryTermListCreateView(generics.ListCreateAPIView):
    serializer_class = PersonalGlossaryTermSerializer

    def get_queryset(self):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except:
            return
        glossary_id = self.kwargs['glossary_id']
        return PersonalGlossaryTerm.objects.filter(
            glossary_id=glossary_id,
            glossary__user=user
        )

    def perform_create(self, serializer):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except:
            return
        glossary = PersonalGlossary.objects.filter(
            id=self.kwargs['glossary_id'],
            user=user
        ).first()
        if not glossary:
            raise PermissionDenied("You don't have permission to add terms to this glossary")
        serializer.save(glossary=glossary)

class PersonalGlossaryTermRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PersonalGlossaryTermSerializer

    def get_queryset(self):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
        except:
            return
        return PersonalGlossaryTerm.objects.filter(
            glossary__user=user
        )
    
class PersonalGlossaryTermCreateView(generics.CreateAPIView):
    serializer_class = PersonalGlossaryTermSerializer

    def perform_create(self, serializer):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.filter(id=payload['id']).first()
            if not user:
                raise AuthenticationFailed('User not found!')
        except:
            raise AuthenticationFailed('Invalid token!')

        glossary_id = self.request.data.get('glossary_id')
        if not glossary_id:
            raise ValidationError({'glossary_id': 'This field is required.'})

        try:
            glossary = PersonalGlossary.objects.get(id=glossary_id, user=user)
        except PersonalGlossary.DoesNotExist:
            raise PermissionDenied("You don't have permission to add terms to this glossary")

        # ✅ Pass the actual glossary object, not `glossary_id`
        serializer.save(glossary=glossary)







class PersonalAnnotationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PersonalAnnotationSerializer
    
    def get_queryset(self):
        auth_header = self.request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')

        user = User.objects.filter(id=payload['id']).first()
        if not user:
            raise AuthenticationFailed('Unauthenticated!')
        return PersonalAnnotation.objects.filter(user=user)


class AnnotationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnnotationSerializer
    
    def get_queryset(self):
        auth_header = self.request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')

        user = User.objects.filter(id=payload['id']).first()
        if not user:
            raise AuthenticationFailed('Unauthenticated!')
        return Annotation.objects.filter(user=user)


from rest_framework import generics
from rest_framework.exceptions import AuthenticationFailed
from .models import Annotation, PersonalAnnotation
from .serializers import AnnotationSerializer, PersonalAnnotationSerializer
from users.models import User
import jwt

class AnnotationListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnotationSerializer

    def get_queryset(self):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        user = User.objects.get(id=payload['id'])
        return Annotation.objects.filter(user=user)

    def perform_create(self, serializer):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')

        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        user = User.objects.get(id=payload['id'])
        serializer.save(user=user)


class PersonalAnnotationListCreateView(generics.ListCreateAPIView):
    serializer_class = PersonalAnnotationSerializer

    def get_queryset(self):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        user = User.objects.get(id=payload['id'])
        return PersonalAnnotation.objects.filter(user=user)

    def perform_create(self, serializer):
        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')

        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        user = User.objects.get(id=payload['id'])
        serializer.save(user=user)

from rest_framework import status


class UserAnnotationsView(APIView):
    def get(self, request):

        auth_header = self.request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed('Unauthenticated!')

        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        user = User.objects.get(id=payload['id'])

        team = user.team
        team_members = User.objects.filter(team=team)

        annotations = Annotation.objects.filter(user__in=team_members)
        personal_annotations = PersonalAnnotation.objects.filter(user__in=team_members)

        annotations_serialized = TeamAnnotationSerializer(annotations, many=True)
        personal_annotations_serialized = TeamPersonalAnnotationSerializer(
            personal_annotations, many=True, context={'request': request}
        )

        return Response({
            "team_id": team.id,
            "team_name": str(team),
            "annotations": annotations_serialized.data,
            "personal_annotations": personal_annotations_serialized.data
        }, status=status.HTTP_200_OK)


class AnnotationStatusUpdateView(APIView):

    def post(self, request, annotation_type, annotation_id, action):
        if annotation_type == 'personal':
            model = PersonalAnnotation
        elif annotation_type == 'atlas':
            model = Annotation
        else:
            return Response({'error': 'Invalid annotation type.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            annotation = model.objects.get(id=annotation_id)
        except model.DoesNotExist:
            return Response({'error': 'Annotation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if action not in ['approve', 'reject']:
            return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

        # if request.user.role != 'admin' and request.user != annotation.user:
        #     return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        annotation.status = 'APPROVED' if action == 'approve' else 'REJECTED'
        annotation.save()

        return Response({
            'message': f'Annotation {annotation.id} has been {annotation.status.lower()}.'
        }, status=status.HTTP_200_OK)