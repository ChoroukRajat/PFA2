from .models import *
from pyapacheatlas.auth import BasicAuthentication
from pyapacheatlas.core import AtlasClient, AtlasEntity
import requests
from django.conf import settings


def prepare_llm_prompt_from_snapshot(instance):
    if hasattr(instance, 'full_json'):
        attributes = instance.full_json.get("attributes", {})
    else:
        attributes = {}

    missing_fields = {k: v for k, v in attributes.items() if not v or (isinstance(v, str) and v.strip() == '')}

    prompt = {
        "entity_type": instance.__class__.__name__,
        "name": getattr(instance, 'name', ''),
        "qualified_name": getattr(instance, 'qualified_name', ''),
        "known_attributes": {k: v for k, v in attributes.items() if k not in missing_fields},
        "missing_fields": list(missing_fields.keys())
    }

    return (
        "You are a metadata steward assistant. Based on the known attributes of the entity below, "
        "recommend suitable values for the missing fields. Only include the missing fields with values in your response.\n"
        f"Input: {prompt}\n"
        "Output (as JSON): {{\"description\": \"...\", \"owner\": \"...\"}}"
    )


def fetch_all_hive_metadata(atlas_service):
    """Main function to fetch and store all Hive metadata"""
    # Step 1: Get all hive_db entries
    response = atlas_service._make_request("/api/atlas/v2/search/dsl", {"query": "from hive_db"})
    if not response or "entities" not in response:
        print("No databases found")
        return

    atlas_url = settings.ATLAS_API_URL + "/api/atlas/v2"
    username = settings.ATLAS_USERNAME
    password = settings.ATLAS_PASSWORD

    auth = BasicAuthentication(username=username, password=password)
    atlas_client = AtlasClient(endpoint_url=atlas_url, authentication=auth)

    for db_summary in response["entities"]:
        db_guid = db_summary["guid"]
        db_entity = atlas_client.get_single_entity(db_guid)
        if not db_entity:
            continue

        # Store the database and get its tables
        table_guids = store_db_and_get_table_guids(db_entity)
        
        # Process each table
        for table_guid in table_guids:
            table_entity = atlas_client.get_single_entity(table_guid)
            if not table_entity:
                continue

            # Store the table and get its columns
            column_guids = store_table_and_get_column_guids(table_entity)
            
            # Process each column
            for column_guid in column_guids:
                column_entity = atlas_client.get_single_entity(column_guid)
                if column_entity:
                    store_column(column_entity)

def store_db_and_get_table_guids(db_entity):
    """Store database metadata and return table GUIDs"""
    entity = db_entity.get("entity") or (db_entity.get("entities", [{}])[0] if "entities" in db_entity else {})
    if not entity:
        return []

    # Store the database
    HiveDatabase.objects.update_or_create(
        guid=entity["guid"],
        defaults={
            "name": entity["attributes"]["name"],
            "qualified_name": entity["attributes"]["qualifiedName"],
            "location": entity["attributes"].get("location"),
            "owner": entity["attributes"].get("owner"),
            "description": entity["attributes"].get("description"),
            "created_by": entity.get("createdBy"),
            "updated_by": entity.get("updatedBy"),
            "create_time": entity.get("createTime"),
            "update_time": entity.get("updateTime"),
            "full_json": db_entity
        }
    )

    # Extract table GUIDs
    return [table["guid"] for table in entity.get("relationshipAttributes", {}).get("tables", [])]

def store_table_and_get_column_guids(table_entity):
    """Store table metadata and return column GUIDs"""
    entity = table_entity.get("entity") or (table_entity.get("entities", [{}])[0] if "entities" in table_entity else {})
    if not entity:
        return []

    # Store the table
    HiveTable.objects.update_or_create(
        guid=entity["guid"],
        defaults={
            "name": entity["attributes"]["name"],
            "qualified_name": entity["attributes"]["qualifiedName"],
            "owner": entity["attributes"].get("owner"),
            "description": entity["attributes"].get("description"),
            "temporary": entity["attributes"].get("temporary", False),
            "table_type": entity["attributes"].get("tableType"),
            "create_time": entity["attributes"].get("createTime"),
            "db_guid": entity["attributes"].get("db", {}).get("guid"),
            "db_name": entity.get("relationshipAttributes", {}).get("db", {}).get("displayText"),
            "created_by": entity.get("createdBy"),
            "updated_by": entity.get("updatedBy"),
            "full_json": table_entity
        }
    )

    # Extract column GUIDs
    return [col["guid"] for col in entity.get("relationshipAttributes", {}).get("columns", [])]

def store_column(column_entity):
    """Store column metadata"""
    entity = column_entity.get("entity") or (column_entity.get("entities", [{}])[0] if "entities" in column_entity else {})
    if not entity:
        return

    HiveColumn.objects.update_or_create(
        guid=entity["guid"],
        defaults={
            "name": entity["attributes"]["name"],
            "qualified_name": entity["attributes"]["qualifiedName"],
            "type": entity["attributes"]["type"],
            "position": entity["attributes"].get("position"),
            "owner": entity["attributes"].get("owner"),
            "table_guid": entity["attributes"].get("table", {}).get("guid"),
            "table_name": entity.get("relationshipAttributes", {}).get("table", {}).get("displayText"),
            "created_by": entity.get("createdBy"),
            "updated_by": entity.get("updatedBy"),
            "create_time": entity.get("createTime"),
            "update_time": entity.get("updateTime"),
            "full_json": column_entity
        }
    )