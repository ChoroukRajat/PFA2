from rest_framework import serializers
from .models import User, Team

class UserSerializer(serializers.ModelSerializer):
    team = serializers.SlugRelatedField(
        queryset=Team.objects.all(),
        slug_field='name',
        required=False  # optional if you want to allow users without a team
    )
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'role','team']
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': False}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)

        # Create the user instance with all remaining validated data
        instance = self.Meta.model(**validated_data)

        # Set the password properly
        if password is not None:
            instance.set_password(password)

        # Save the instance with first_name and last_name included
        instance.save()
        return instance
