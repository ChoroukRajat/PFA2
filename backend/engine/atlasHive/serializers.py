from rest_framework import serializers
from .models import PersonalGlossary, PersonalGlossaryTerm, PersonalAnnotation, Annotation

class PersonalGlossarySerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalGlossary
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class PersonalGlossaryTermSerializer(serializers.ModelSerializer):
    glossary_id = serializers.IntegerField(source='glossary.id')  

    class Meta:
        model = PersonalGlossaryTerm
        fields = ['id', 'glossary_id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

# serializers.py
from rest_framework import serializers
from .models import PersonalGlossary, PersonalGlossaryTerm, PersonalAnnotation, Annotation
from users.models import User
import jwt
from rest_framework.exceptions import AuthenticationFailed

class PersonalAnnotationSerializer(serializers.ModelSerializer):
    term_id = serializers.PrimaryKeyRelatedField(
        queryset=PersonalGlossaryTerm.objects.all(),
        source='term',
        write_only=True
    )
    term_name = serializers.CharField(source='term.name', read_only=True)
    glossary_name = serializers.CharField(source='term.glossary.name', read_only=True)

    class Meta:
        model = PersonalAnnotation
        fields = [
            'id', 'entity_name', 'entity_type',
            'term_id', 'term_name', 'glossary_name',
            'comment', 'proposed_changes', 'status',
            'created_at'
        ]
        read_only_fields = [
            'id', 'term_name', 'glossary_name',
            'status', 'created_at'
        ]

    def validate_term_id(self, value):
        auth_header = self.context['request'].headers.get('Authorization')
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

        if not value.glossary.user == user:
            raise serializers.ValidationError("You can only use terms from your own glossaries")
        return value

class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = [
            'id', 'entity_name', 'entity_type',
            'term_name', 'comment', 'proposed_changes',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at']