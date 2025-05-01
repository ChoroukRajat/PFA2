from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from .serializers import UserSerializer
from .models import User, Team
import jwt
from datetime import datetime, timedelta, UTC, timezone
import random
from django.db import transaction
from rest_framework.response import Response
from rest_framework import status
import random
import string
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model

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
        data = request.data.copy()  # Make a mutable copy
        team_name = data.get('last_name')  # Safely get 'team' from request

        if team_name:
            team, _ = Team.objects.get_or_create(name=team_name)
            data['team'] = team.name  # If using SlugRelatedField for 'team'

        serializer = UserSerializer(data=data)
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

        payload = {
            'id': user.id,
            'exp': datetime.now(UTC) + timedelta(minutes=60), 
            'iat': datetime.now(UTC)  
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
                'team_name': team.name
            } for user in users]
            
            return Response({'users': data}, status=status.HTTP_200_OK)
            
        except Team.DoesNotExist:
            return Response({'error': 'Team not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)