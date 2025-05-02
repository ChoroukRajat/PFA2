from pyapacheatlas.core import AtlasClient
from pyapacheatlas.auth import BasicAuthentication

def get_atlas_client(user):
    from core.models import Credentials

    creds = Credentials.objects.get(user=user)
    auth = BasicAuthentication(creds.atlas_username, creds.atlas_password)
    return AtlasClient(
        endpoint_url="{ATLAS_HOST}",
        authentication=auth
    )

def get_hive_table_metadata(user, qualified_name):
    client = get_atlas_client(user)
    entity = client.get_entity(qualified_name=qualified_name)

    columns = []
    for col in entity["entities"]:
        if col["typeName"] == "hive_column":
            columns.append({
                "name": col["attributes"]["name"],
                "qualifiedName": col["attributes"]["qualifiedName"],
                "description": col["attributes"].get("description"),
                "type": col["attributes"]["type"],
            })
    
    return {
        "table_name": entity["entities"][0]["attributes"]["name"],
        "columns": columns
    }
