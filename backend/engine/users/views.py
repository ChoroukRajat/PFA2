from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from .serializers import UserSerializer, SimpleRegisterSerializer
from .models import User, Team
import jwt
from datetime import datetime, timedelta, UTC, timezone
import random
from django.db import transaction
from rest_framework.response import Response
from rest_framework import status
import random
import string
from rest_framework.response import Response
from django.utils.timezone import now

UTC1 = timezone.utc

class GitHubOAuthView(APIView):
    def post(self, request):
        email = request.data.get('email')
        name = request.data.get('name')
        role = request.data.get('role', 'admin')  

        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        first_name = name.split()[0] if name else ''
        last_name = ' '.join(name.split()[1:]) if name and len(name.split()) > 1 else ''

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'role': role,
                'is_active': True,
                'password': str(random.randint(100000, 999999))
            }
        )

        # Optional: Update role if the user already existed with a different role
        if not created and user.role != role:
            user.role = role
            user.save()

        # JWT Token generation
        payload = {
            'id': user.id,
            'exp': datetime.now(UTC1) + timedelta(hours=1),
            'iat': datetime.now(UTC1)
        }

        token = jwt.encode(payload, 'secret', algorithm='HS256')

        return Response({
            'token': token,
            'redirectUrl': f'/role/{user.role}/{user.id}',
            'idUtilisateur': user.id
        }, status=status.HTTP_200_OK)

class RegisterView(APIView):
    def post(self, request):
        data = request.data.copy()
        team_name = data.get('last_name')  

        if team_name:
            data['team_name'] = team_name  

        serializer = SimpleRegisterSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class LoginView(APIView):
    def post(self, request):
        email = request.data['email']
        password = request.data['password']

        user = User.objects.filter(email=email).first()

        if user is None:
            raise AuthenticationFailed('User not found!')

        if not user.check_password(password):
            raise AuthenticationFailed('Incorrect password!')

        if not user.is_active:
            raise AuthenticationFailed('User is deactivated! Please contact your team manager.')

        # Save the login date
        user.last_login_date = now().date()
        user.save(update_fields=['last_login_date'])

        payload = {
            'id': user.id,
            'exp': datetime.now().astimezone() + timedelta(minutes=60),
            'iat': datetime.now().astimezone()
        }

        token = jwt.encode(payload, 'secret', algorithm='HS256')

        response = Response()
        response.data = {
            'token': token,
            'redirectUrl': '/role/' + user.role + '/' + str(user.id),
            'idUtilisateur': user.id
        }
        return response


class UserView(APIView):
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
        serializer = UserSerializer(user)
        return Response(serializer.data)


def generate_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

class BulkCreateUsersView(APIView):
    def post(self, request):
        # 1. Get and verify token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({"error": "Token missing or invalid"}, status=401)

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])  # Replace 'secret' with settings.SECRET_KEY if used
            user_id = payload.get('id')
        except jwt.ExpiredSignatureError:
            return Response({"error": "Token expired!"}, status=401)
        except jwt.DecodeError:
            return Response({"error": "Token decoding error!"}, status=401)

        # 2. Ensure user exists
        try:
            authenticated_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        # Optional: Only allow admins to create users
        if authenticated_user.role != "admin":
            return Response({"error": "Unauthorized access"}, status=403)

        # 3. Parse input data
        users_data = request.data
        if not isinstance(users_data, list):
            return Response({"error": "Expected a list of users."}, status=400)

        created_users = []

        try:
            with transaction.atomic():
                for user_data in users_data:
                    email = user_data.get("email")
                    first_name = user_data.get("first_name", "")
                    last_name = user_data.get("last_name", "")
                    role = user_data.get("role", "admin")
                    team_name = authenticated_user.team.name

                    if not email or not team_name:
                        return Response({"error": "Each user must have an email and team."}, status=400)

                    team, _ = Team.objects.get_or_create(name=team_name)

                    raw_password = generate_password()

                    new_user = User.objects.create(
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        role=role,
                        team=team
                    )
                    new_user.set_password(raw_password)
                    new_user.save()

                    created_users.append({
                        "email": new_user.email,
                        "role": new_user.role,
                        "team": team.name,
                        "generated_password": raw_password
                    })

            return Response({"created_users": created_users}, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User, Team

class TeamUsersView(APIView):
    def get(self, request, team_id):
        try:
            # Verify team exists
            team = Team.objects.get(id=team_id)
            
            # Get all users for this team
            users = User.objects.filter(team=team).order_by('email')
            
            # Prepare response data
            data = [{
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'team_id': team_id,
                'team_name': team.name,
                'is_active' : user.is_active
            } for user in users]
            
            return Response({'users': data}, status=status.HTTP_200_OK)
            
        except Team.DoesNotExist:
            return Response({'error': 'Team not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ToggleTeamUsersActiveStatusView(APIView):
    def post(self, request):
        team_id = request.data.get('team_id')
        action = request.data.get('action')  # 'activate' or 'deactivate'

        if team_id is None or action not in ['activate', 'deactivate']:
            return Response({'error': 'Invalid parameters'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return Response({'error': 'Team not found'}, status=status.HTTP_404_NOT_FOUND)

        is_active = True if action == 'activate' else False
        updated_count = User.objects.filter(team=team).update(is_active=is_active)

        return Response({
            'message': f'{updated_count} user(s) have been {"activated" if is_active else "deactivated"} successfully.'
        }, status=status.HTTP_200_OK)
    

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import DataDomain, User, Team
from .serializers import DataDomainSerializer
from django.shortcuts import get_object_or_404

# Create data domain
class CreateDataDomainView(APIView):
    def post(self, request):
        serializer = DataDomainSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Update data domain
class UpdateDataDomainView(APIView):
    def put(self, request, pk):
        domain = get_object_or_404(DataDomain, pk=pk)
        serializer = DataDomainSerializer(domain, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete data domain
class DeleteDataDomainView(APIView):
    def delete(self, request, pk):
        domain = get_object_or_404(DataDomain, pk=pk)
        domain.delete()
        return Response({"message": "Deleted"}, status=status.HTTP_204_NO_CONTENT)

# Add data domain to user
class AddDataDomainToUser(APIView):
    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        domain_id = request.data.get('domain_id')
        domain = get_object_or_404(DataDomain, id=domain_id)
        user.data_domains.add(domain)
        return Response({"message": "Domain added"})

# Remove data domain from user
class RemoveDataDomainFromUser(APIView):
    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        domain_id = request.data.get('domain_id')
        domain = get_object_or_404(DataDomain, id=domain_id)
        user.data_domains.remove(domain)
        return Response({"message": "Domain removed"})

# Replace all user's domains
class ReplaceUserDataDomains(APIView):
    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        domain_ids = request.data.get('domain_ids', [])
        user.data_domains.set(domain_ids)
        return Response({"message": "User's data domains updated"})


from rest_framework import generics

class TeamDataDomainListView(generics.ListAPIView):
    serializer_class = DataDomainSerializer

    def get_queryset(self):
        team_id = self.kwargs['team_id']
        team = get_object_or_404(Team, id=team_id)
        return DataDomain.objects.filter(team=team)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# In your views.py
class ToggleUserStatusView(APIView):
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = request.data.get('is_active', not user.is_active)
            user.save()
            return Response({"message": "User status updated successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)