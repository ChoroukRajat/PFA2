from rest_framework import serializers
from .models import User, Team, DataDomain

class DataDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataDomain
        fields = ['id', 'name', 'description', 'team']

class UserSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    team_id = serializers.PrimaryKeyRelatedField(source='team', read_only=True)
    data_domains = DataDomainSerializer(many=True, read_only=True)
    last_login_date = serializers.DateField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'password',
            'first_name',
            'last_name',
            'role',
            'team',
            'team_id',
            'team_name',
            'last_login_date',
            'data_domains',
            'is_active',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': False},
            'team': {'write_only': True}
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Group team details under 'team'
        representation['team'] = {
            'id': representation.pop('team_id'),
            'name': representation.pop('team_name')
        }
        return representation

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class SimpleRegisterSerializer(serializers.ModelSerializer):
    team_id = serializers.PrimaryKeyRelatedField(
        queryset=Team.objects.all(), source='team', required=False
    )
    team_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'team_id', 'team_name']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        team = validated_data.pop('team', None)
        team_name = self.initial_data.get('team_name')

        # Handle team creation or retrieval
        if not team and team_name:
            team, _ = Team.objects.get_or_create(name=team_name)

        validated_data['team'] = team

        # REMOVE team_name if still in validated_data
        validated_data.pop('team_name', None)

        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
