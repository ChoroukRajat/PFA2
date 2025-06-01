# services/atlas_service.py
import requests
import base64
from django.conf import settings
from django.utils import timezone
from atlasHive.models import AtlasDataCache
from users.models import User
import logging
import json

logger = logging.getLogger(__name__)

class AtlasService:
    def __init__(self, user):
        self.user = user
        self.base_url = settings.ATLAS_API_URL
        self.auth_token = base64.b64encode(
            f"{settings.ATLAS_USERNAME}:{settings.ATLAS_PASSWORD}".encode()
        ).decode()
        self.headers = {
            "Authorization": f"Basic {self.auth_token}",
            "Content-Type": "application/json"
        }

    def _make_request(self, endpoint, params=None):
        try:
            response = requests.get(
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                params=params,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Atlas API request failed: {str(e)}")
            raise

    def _store_data(self, data_type, data):
        """Store complete API response in database"""
        AtlasDataCache.objects.update_or_create(
            user=self.user,
            data_type=data_type,
            defaults={
                'name': f'{data_type}_data',
                'qualified_name': f'{data_type}_data',
                'raw_data': data,
                'is_changed': False
            }
        )

    def _get_cached_data(self, data_type):
        """Helper to get cached data or refresh if needed"""
        try:
            if (data_type=="hive_columns"):
                cached = AtlasDataCache.objects.filter(
                user=self.user,
                data_type="hive_column",
                is_changed=False
            ).order_by('-id').first()
            else:
                cached = AtlasDataCache.objects.filter(
                    user=self.user,
                    data_type=data_type,
                    is_changed=False
                ).order_by('-id').first()
                if cached is None:
                    self.sync_hive_db()
                    self.sync_hive_table()
                    self.sync_hive_columns()
                    self.sync_glossary()
                    cached = AtlasDataCache.objects.filter(
                        user=self.user,
                        data_type=data_type,
                        is_changed=False
                        ).order_by('-id').first()
            return cached.raw_data
        except AtlasDataCache.DoesNotExist:
            # If not found or changed, sync fresh data
            
            sync_method = getattr(self, f'sync_{data_type}')
            sync_method()
            cached = AtlasDataCache.objects.filter(
                user=self.user,
                data_type=data_type,
                is_changed=False
            ).order_by('-id').first()
            return cached.raw_data

    def sync_hive_db(self):
        """Retrieve and store all databases"""
        data = self._make_request("/api/atlas/v2/search/dsl", {"query": "from hive_db"})
        self._store_data('hive_db', data)
        return data.get('entities', [])

    def sync_hive_table(self):
        """Retrieve and store all tables"""
        data = self._make_request("/api/atlas/v2/search/dsl", {"query": "from hive_table"})
        self._store_data('hive_table', data)
        return data.get('entities', [])

    def sync_hive_columns(self):
        """Retrieve and store all columns"""
        data = self._make_request("/api/atlas/v2/search/dsl", {"query": "from hive_column"})
        self._store_data('hive_column', data)
        return data.get('entities', [])

    def sync_glossary(self):
        """Retrieve and store glossary"""
        data = self._make_request("/api/atlas/v2/glossary")
        # Handle both array and object response formats
        if isinstance(data, dict):
            data = [data]
        self._store_data('glossary', data)
        return data

    def get_all_databases(self):
        """Get all databases from cached data"""
        try:
            data = self._get_cached_data('hive_db')
            return [{
                'name': db.get('attributes', {}).get('name'),
                'qualified_name': db.get('attributes', {}).get('qualifiedName'),
                'metadata': db.get('attributes', {})
            } for db in data.get('entities', [])]
        except Exception as e:
            logger.error(f"Error getting databases: {str(e)}")
            return []

    def get_tables_for_database(self, db_name):
        """Get tables for a specific database by name"""
        try:
            data = self._get_cached_data('hive_table')
            tables = []
            
            for table in data.get('entities', []):
                # Extract database name from table's qualifiedName
                table_qn = table.get('attributes', {}).get('qualifiedName', '')
                table_db_name = table_qn.split('.')[0] if '.' in table_qn else ''
                
                # Alternative: check relationshipAttributes if qualifiedName parsing fails
                if not table_db_name:
                    db_relation = table.get('relationshipAttributes', {}).get('db', {})
                    if isinstance(db_relation, list) and db_relation:
                        table_db_name = db_relation[0].get('displayText', '')
                    elif isinstance(db_relation, dict):
                        table_db_name = db_relation.get('displayText', '')
                
                if table_db_name == db_name:
                    tables.append({
                        'name': table.get('attributes', {}).get('name', ''),
                        'qualified_name': table.get('attributes', {}).get('qualifiedName', ''),
                        'metadata': table.get('attributes', {})
                    })
            return tables
        except Exception as e:
            logger.error(f"Error getting tables: {str(e)}")
            return []

    def get_columns_for_table(self, table_name):
        """Get columns for a specific table by name"""
        try:
            data = self._get_cached_data('hive_columns')
            columns = []
            
            for column in data.get('entities', []):
                # Extract table name from column's qualifiedName
                column_qn = column.get('attributes', {}).get('qualifiedName', '')
                column_table_name = column_qn.split('.')[1] if '.' in column_qn else ''
                
                # Alternative: check relationshipAttributes if qualifiedName parsing fails
                if not column_table_name:
                    table_relation = column.get('relationshipAttributes', {}).get('table', {})
                    if isinstance(table_relation, list) and table_relation:
                        column_table_name = table_relation[0].get('displayText', '')
                    elif isinstance(table_relation, dict):
                        column_table_name = table_relation.get('displayText', '')
                
                if column_table_name == table_name:
                    columns.append({
                        'name': column.get('attributes', {}).get('name', ''),
                        'qualified_name': column.get('attributes', {}).get('qualifiedName', ''),
                        'metadata': column.get('attributes', {})
                    })
            return columns
        except Exception as e:
            logger.error(f"Error getting columns: {str(e)}")
            return []

    def get_all_databases(self):
        """Get all databases from cached data"""
        try:
            data = self._get_cached_data('hive_db')
            return [{
                'name': db.get('attributes', {}).get('name', ''),
                'qualified_name': db.get('attributes', {}).get('qualifiedName', ''),
                'metadata': db.get('attributes', {})
            } for db in data.get('entities', [])]
        except Exception as e:
            logger.error(f"Error getting databases: {str(e)}")
            return []

    def get_glossary_terms(self):
        """Get all glossary terms"""
        try:
            data = self._get_cached_data('glossary')
            terms = []
            
            # Handle both array and single glossary responses
            glossaries = data if isinstance(data, list) else [data] if data else []
            
            for glossary in glossaries:
                for term in glossary.get('terms', []):
                    terms.append({
                        'name': term.get('displayText', ''),
                        'relation_guid': term.get('relationGuid', '')
                    })
            return terms
        except Exception as e:
            logger.error(f"Error getting glossary terms: {str(e)}")
            return []

    def get_full_metadata_hierarchy(self):
        """Get complete hierarchical metadata structure"""
        try:
            databases = self.get_all_databases()
            tables_data = self._get_cached_data('hive_table')
            columns_data = self._get_cached_data('hive_column')
            
            tables = tables_data.get('entities', [])
            columns = columns_data.get('entities', [])
            
            hierarchy = {
                "databases": [],
                "glossary_terms": self.get_glossary_terms()
            }
            
            for db in databases:
                db_entry = {
                    'name': db['name'],
                    'qualified_name': db['qualified_name'],
                    'tables': []
                }
                
                # Find tables for this database
                for table in tables:
                    db_relation = table.get('relationshipAttributes', {}).get('db', {})
                    if isinstance(db_relation, list):
                        db_relation = db_relation[0] if db_relation else {}
                    
                    if db_relation.get('displayText') == db['name']:
                        table_entry = {
                            'name': table.get('attributes', {}).get('name'),
                            'qualified_name': table.get('attributes', {}).get('qualifiedName'),
                            'columns': []
                        }
                        
                        # Find columns for this table
                        for column in columns:
                            table_relation = column.get('relationshipAttributes', {}).get('table', {})
                            if isinstance(table_relation, list):
                                table_relation = table_relation[0] if table_relation else {}
                            
                            if table_relation.get('displayText') == table_entry['name']:
                                table_entry['columns'].append({
                                    'name': column.get('attributes', {}).get('name'),
                                    'qualified_name': column.get('attributes', {}).get('qualifiedName')
                                })
                        
                        db_entry['tables'].append(table_entry)
                
                hierarchy['databases'].append(db_entry)
            
            return hierarchy
        except Exception as e:
            logger.error(f"Error getting full hierarchy: {str(e)}")
            return {
                "databases": [],
                "glossary_terms": []
            }