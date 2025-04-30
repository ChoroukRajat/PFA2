import json
from pyapacheatlas.auth import BasicAuthentication
from pyapacheatlas.core import AtlasClient, AtlasEntity

# Step 1: Authentification
atlas_url = "http://192.168.164.131:21000/api/atlas/v2"
username = "admin"
password = "ensias2023"

auth = BasicAuthentication(username=username, password=password)
client = AtlasClient(endpoint_url=atlas_url, authentication=auth)

# Step 2: Référence vers la base de données existante
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

# Step 3: Définition des colonnes
columns = [
    AtlasEntity(
        name="product_category",
        typeName="hive_column",
        qualified_name="db_student.sales_data.product_category@Sandbox_storage",
        guid="-2",
        attributes={
            "type": "string",
            "owner": "hive"
        }
    )
]

# Step 4: Définition de la table Hive avec les colonnes dans relationshipAttributes
new_table = AtlasEntity(
    name="sales_data",
    typeName="hive_table",
    qualified_name="db_student.sales_data@Sandbox_storage",
    guid="-1",
    attributes={
        "owner": "hive",
        "description": "Table contenant des données de vente",
        "createTime": 1700000000000,
        "db": db_atlas.to_json(minimum=True)
    },
    relationshipAttributes={
        "columns": [col.to_json(minimum=True) for col in columns]
    }
)

print(db_atlas.to_json(minimum=True)) # => {'typeName': 'hive_db', 'guid': '0fdce6cb-3aaf-4123-a00b-1b1789432b6e', 'qualifiedName': 'db_student@Sandbox'}
# Step 5: Upload vers Atlas
entities = [new_table] + columns
#results = client.upload_entities(entities)
#print(json.dumps(results, indent=2))
