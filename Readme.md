# 🧠 Metadata Governance Recommendation Engine

## 🔍 Description

Ce projet vise à concevoir et implémenter un **moteur de recommandation intelligent pour la gouvernance des métadonnées**, s’intégrant dans un écosystème Hadoop (Apache Atlas, Hive, HBase). Il permet aux différents profils utilisateurs (administrateur, analyste de données, data steward) d'interagir avec les métadonnées pour assurer la qualité, la classification, l’annotation et la traçabilité des données.

## 📌 Fonctionnalités principales

### 👤 Administrateur
- Création de comptes via formulaire ou fichier CSV
- Gestion des équipes et des domaines de données
- Suivi des activités des membres et génération de rapports PDF

### 📊 Data Analyst
- Upload et prétraitement automatique des fichiers CSV
- Détection des valeurs manquantes, doublons, outliers, types, patterns, etc.
- Annotation des colonnes via glossaire métier (Apache Atlas) ou personnalisé
- Chargement des données dans Hive et HBase

### 🛡️ Data Steward
- Validation ou rejet des annotations
- Recommandations sur la qualité des métadonnées (types, descriptions, owners…)
- Suggestions de classification, rétention, dédoublonnage et data lineage

## 🏗️ Architecture

Le système repose sur une architecture modulaire en trois couches :
- **Frontend** : Interface utilisateur développée avec **Next.js**
- **Backend** : APIs Django et traitement des données via **Python**
- **Système de métadonnées** : Intégration avec **Apache Atlas**, **Hive**, **HBase**

## 🧰 Technologies utilisées

| Outil / Technologie | Rôle |
|---------------------|------|
| ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white) | Backend & traitement de données |
| ![Django](https://img.shields.io/badge/-Django-092E20?logo=django&logoColor=white) | Framework backend |
| ![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=next.js&logoColor=white) | Frontend (React) |
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?logo=postgresql&logoColor=white) | Base de données relationnelle |
| ![Apache Atlas](https://img.shields.io/badge/-Apache%20Atlas-F17C00?logo=apache&logoColor=white) | Système de gestion des métadonnées |
| Hive & HBase | Stockage Big Data (Hadoop) |
| KMeans, PCA, LLM | Modèles de recommandation |

## ⚙️ Installation

1. Installation Hdp Sandbox

- Installer VMware ou Virtual Box
- Télécharger et installer l'image iso depuis le lien suivant :
    https://hackmd.io/@firasj/BkSQJQ8eh
- Allumer la machine virtuelle et Configurer le service Ambari et Apache Atlas

2. Cloner le dépôt :
   ```bash
   git clone https://github.com/ChoroukRajat/PFA2.git
   cd backend/engine
   ```

3. Configuration de la base de donnée et Apache Atlas dans le fichier settings.py
- Base de données :
    ```bash
            DATABASES = {
                'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': os.getenv("DATABASE_NAME"),
                'USER': os.getenv("DATABASE_USER"),
                'PASSWORD': os.getenv("DATABASE_PASS"),
                'HOST': 'localhost',  # Changer ceci si vous utiliser un autre serveur
                'PORT': '5432',       # Le port par défaut pour PostgreSQL
            }
        }
   ```
- Apache Atlas :
    ```bash
        ATLAS_USERNAME = 'admin'
        ATLAS_PASSWORD = 'ensias2025'
        ATLAS_API_URL = 'http://192.168.161.130:21000'
        LLM_API_KEY = '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'

    ```


3. Configurer le fichier .env dans la racine du dossier backend
    ```bash
        DEBUG=True
        SECRET_KEY=django-insecure-qu%cxs7=+dmizu&$&+0o-bd#7tvv5h-8o7q1)^av8hum!fczf!
        DATABASE_USER=postgres
        DATABASE_PASS=123456
        DATABASE_NAME=pfa2
        FERNET_SECRET_KEY=UO2r7plbq31UchpR4GY7mtlLeWeY9N9FGA7WbdadTPQ=

        ATLAS_HOST =http://192.168.164.131:21000/api/atlas/v2

   ```
4. Télécharger les requirements
    ```bash
        pip install requirements.txt
    ```
5. Configurer la partie Frontend
    ```bash
        cd frontend/GovernX_Front
        npm install
    ```
6. Lancement du projet 
- Service Backend
    ```bash
        cd backend/engine
        python manage.py runserver
    ```
- Service Frontend
    ```bash
        cd frontend/GovernX_Front
        npm run dev
    ```
- Accès au projet sur : http://localhost:3000/ 
