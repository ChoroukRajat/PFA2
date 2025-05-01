from rest_framework import serializers
from .models import User, Team

class UserSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    team_id = serializers.PrimaryKeyRelatedField(source='team', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'role', 'team', 'team_id', 'team_name']
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': False},
            'team': {'write_only': True}  # Hide team object in output
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Include both team ID and name in the output
        representation['team'] = {
            'id': representation.pop('team_id'),
            'name': representation.pop('team_name')
        }
        return representation

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        
        if password is not None:
            instance.set_password(password)
        
        instance.save()
        return instance
