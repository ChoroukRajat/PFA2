import json
from pyapacheatlas.auth import BasicAuthentication
from pyapacheatlas.core import AtlasClient, AtlasEntity

# Step 1: Authentication
atlas_url = "http://192.168.164.131:21000/api/atlas/v2"
username = "admin"
password = "ensias2023"

auth = BasicAuthentication(username=username, password=password)
client = AtlasClient(endpoint_url=atlas_url, authentication=auth)

# Step 2: Existing Hive DB
db = {
    "typeName": "hive_db",
    "attributes": {
        "owner": "hive",
        "qualifiedName": "db_student@Sandbox",
        "name": "db_student"
    },
    "guid": "0fdce6cb-3aaf-4123-a00b-1b1789432b6e",
    "status": "ACTIVE",
    "displayText": "db_student"
}

db_atlas = AtlasEntity("db_student","hive_db","db_student@Sandbox").from_json(db)

# Step 3: New Hive Table
new_table = AtlasEntity(
    name="sales_data",
    typeName="hive_table",
    qualified_name="db_student.sales_data@Sandbox_storage",
    guid="-1",
    attributes={
        "owner": "hive",
        "description": "Table contenant des données de vente",
        "createTime": 1700000000000,
        "db": db_atlas.to_json(minimum=True)  # Only include essential db info
    },
    relationships={
        "columns": []  # Placeholder for now
    }
)

# Step 4: Upload entity to Atlas
results = client.upload_entities([new_table])
print(json.dumps(results, indent=2))
