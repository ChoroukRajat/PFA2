import json
from pyapacheatlas.auth import BasicAuthentication
from pyapacheatlas.core import AtlasClient, AtlasEntity

# Step 1: Authentication
atlas_url = "http://192.168.161.130:21000/api/atlas/v2"
username = "admin"
password = "ensias2025"

auth = BasicAuthentication(username=username, password=password)
client = AtlasClient(endpoint_url=atlas_url, authentication=auth)

# Step 2: Existing Hive DB
db = {
    "typeName": "hive_db",
    "attributes": {
        "owner": "hive",
        "qualifiedName": "pfa@Sandbox",
        "name": "pfa"
    },
    "guid": "8cbae0e4-61de-4add-b097-fdbf038f2c6e",
    "status": "ACTIVE",
    "displayText": "pfa"
}

db_atlas = AtlasEntity("pfa","hive_db","pfa@Sandbox").from_json(db)

# Step 3: New Hive Table
# new_table = AtlasEntity(
#     name="sales_data",
#     typeName="hive_table",
#     qualified_name="pfa.sales_data@Sandbox_storage",
#     guid="-1",
#     attributes={
#         "owner": "hive",
#         "description": "Table contenant des données de vente",
#         "createTime": 1700000000000,
#         "db": db_atlas.to_json(minimum=True)  # Only include essential db info
#     },
#     relationships={
#         "columns": []  # Placeholder for now
#     }
# )



# Step 4: Upload entity to Atlas
#results = client.upload_entities([new_table])

# update single attribute
# results = client.partial_update_entity(
#     guid="96db353c-fc5e-4955-841e-eda8ed8adc76",
#     attributes={
#         "description": {
#             "value": "This is the new description."
#         }
#     }
# )

# print("hive table exemple response")
# # results = client.get_single_entity(
# #     guid="96db353c-fc5e-4955-841e-eda8ed8adc76"
# # )

# results = client.get_single_entity(
#     guid= "b1b4edad-11b6-4d78-bfc4-9131b7075fa7"
# )

# print(json.dumps(results, indent=2))
# print("************\n")
# print("hive_db exemple response\n")

# results = client.get_entity(
#     guid= "8cbae0e4-61de-4add-b097-fdbf038f2c6e"
# )
# print(json.dumps(results, indent=2))

print("************\n")
print("hive column exemple response\n")
results = client.get_single_entity(
    guid= "d0ac34e5-912d-4183-80fd-97ba775acfef"
)



print(json.dumps(results, indent=2))


# import json
# import requests

# response = requests.post(
#     url="https://openrouter.ai/api/v1/chat/completions",
#     headers={
#         "Authorization": "Bearer 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",
#         "Content-Type": "application/json"
#     },
#     data=json.dumps({
#         "model": "deepseek/deepseek-prover-v2:free",
#         "messages": [
#             {
#                 "role": "user",
#                 "content": "What is the meaning of life?"
#             }
#         ],
#     })
# )

# print(response.status_code)
# print(response.json())

