from django.shortcuts import render

# Create your views here.
import jwt
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from users.models import User

def get_authenticated_user(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        raise AuthenticationFailed('Unauthenticated!')

    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, 'secret', algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token expired!')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Invalid token!')

    return User.objects.get(id=payload['id'])


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from  atlasHive.models import Annotation, PersonalAnnotation
from metadata.models import MetadataRecommendation
from core.models import File



class TeamDashboardView(APIView):
    def get(self, request, *args, **kwargs):
        user = get_authenticated_user(request)
        team = user.team
        team_members = User.objects.filter(team=team)

        # Annotations
        annotations = Annotation.objects.filter(user__in=team_members)
        annotation_stats = annotations.values('status').annotate(count=Count('status'))
        total_annotations = annotations.count()
        pending_annotations = annotations.filter(status='PENDING').count()

        # Personal Annotations
        personal_annotations = PersonalAnnotation.objects.filter(user__in=team_members)
        personal_annotation_stats = personal_annotations.values('status').annotate(count=Count('status'))
        total_personal_annotations = personal_annotations.count()

        # Metadata Recommendations — no user-based filtering
        recommendations = MetadataRecommendation.objects.all()
        recommendation_stats = recommendations.values('status').annotate(count=Count('status'))
        total_recommendations = recommendations.count()

        # File Uploads
        files = File.objects.filter(user__in=team_members)
        total_files = files.count()

        data = {
            'annotations': {
                'total': total_annotations,
                'stats': {item['status']: item['count'] for item in annotation_stats},
                'pending': pending_annotations
            },
            'personal_annotations': {
                'total': total_personal_annotations,
                'stats': {item['status']: item['count'] for item in personal_annotation_stats}
            },
            'metadata_recommendations': {
                'total': total_recommendations,
                'stats': {item['status']: item['count'] for item in recommendation_stats}
            },
            'file_uploads': {
                'total': total_files
            }
        }

        return Response(data, status=status.HTTP_200_OK)



class TeamAnnotationsByTypeView(APIView):
    def get(self, request, *args, **kwargs):
        user = get_authenticated_user(request)
        team = user.team
        team_members = User.objects.filter(team=team)

        annotations = Annotation.objects.filter(user__in=team_members)
        annotations_by_type = annotations.values('entity_type').annotate(count=Count('entity_type'))

        return Response(annotations_by_type, status=status.HTTP_200_OK)


from django.db.models.functions import TruncDate

class TeamFileUploadsOverTimeView(APIView):
    def get(self, request, *args, **kwargs):
        user = get_authenticated_user(request)
        team = user.team
        team_members = User.objects.filter(team=team)

        uploads_over_time = File.objects.filter(user__in=team_members) \
            .annotate(upload_date=TruncDate('date_uploaded')) \
            .values('upload_date') \
            .annotate(count=Count('id')) \
            .order_by('upload_date')

        return Response(uploads_over_time, status=status.HTTP_200_OK)


class TeamActivityTimelineView(APIView):
    def get(self, request, *args, **kwargs):
        user = get_authenticated_user(request)
        team = user.team
        team_members = User.objects.filter(team=team)

        # Annotations
        annotations = Annotation.objects.filter(user__in=team_members).order_by('-created_at')[:5]
        annotation_activities = [
            {
                'type': 'annotation',
                'user': f"{annotation.user.first_name} {annotation.user.last_name}",
                'entity_name': annotation.entity_name,
                'term_name': annotation.term_name,
                'status': annotation.status,
                'created_at': annotation.created_at
            } for annotation in annotations
        ]

        # Personal Annotations
        personal_annotations = PersonalAnnotation.objects.filter(user__in=team_members).order_by('-created_at')[:5]
        personal_annotation_activities = [
            {
                'type': 'personal_annotation',
                'user': f"{annotation.user.first_name} {annotation.user.last_name}",
                'entity_name': annotation.entity_name,
                'term_name': annotation.term.name,
                'status': annotation.status,
                'created_at': annotation.created_at
            } for annotation in personal_annotations
        ]

        # File Uploads
        files = File.objects.filter(user__in=team_members).order_by('-date_uploaded')[:5]
        file_activities = [
            {
                'type': 'file_upload',
                'user': f"{file.user.first_name} {file.user.last_name}",
                'file_name': file.file_name,
                'date_uploaded': file.date_uploaded
            } for file in files
        ]

        # Combine and sort activities
        activities = annotation_activities + personal_annotation_activities + file_activities
        activities.sort(key=lambda x: x.get('created_at', x.get('date_uploaded')), reverse=True)

        return Response(activities[:10], status=status.HTTP_200_OK)


