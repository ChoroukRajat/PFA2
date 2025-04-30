import pandas as pd

# Charger le CSV
df = pd.read_csv("data.csv")

# Convertir en JSON et sauvegarder
df.to_json("data.json", orient="records", indent=4)


