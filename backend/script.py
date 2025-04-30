import paramiko
import os
import csv

def load_csv_to_hbase():
    # Configuration SSH
    host = '192.168.164.131'
    port = 2222 
    username = 'root'
    password = 'ensias2023'

    # Chemins des fichiers
    local_csv_path = 'data.csv'
    remote_csv_path = f"/tmp/{os.path.basename(local_csv_path)}"
    remote_cmd_file = '/tmp/hbase_commands.txt'
    
    # Configuration HBase - À ADAPTER selon votre environnement
    table_name = 'data'       # Nom de votre table existante
    column_family = 'cf'      # Nom de votre famille de colonnes existante

    # Vérification du fichier CSV
    if not os.path.exists(local_csv_path):
        print(f"Erreur: Fichier '{local_csv_path}' introuvable")
        print(f"Répertoire actuel: {os.getcwd()}")
        print("Fichiers disponibles:")
        print(os.listdir('.'))
        return

    # Connexion SSH/SFTP
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)
    sftp = ssh.open_sftp()

    try:
        """
        # PARTIE CRÉATION DE TABLE (COMMENTÉE)
        # -----------------------------------
        with sftp.file(remote_cmd_file, 'w') as f:
            f.write(f"create '{table_name}', '{column_family}'\n")
            f.write("exit\n")

        stdin, stdout, stderr = ssh.exec_command(f"hbase shell {remote_cmd_file}")
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status != 0:
            error = stderr.read().decode()
            print(f"Échec création table. Code: {exit_status}, Erreur: {error}")
            return

        # Vérification existence table
        stdin, stdout, stderr = ssh.exec_command(f"echo \"exists '{table_name}'\" | hbase shell")
        output = stdout.read().decode()
        
        if f"Table {table_name} does exist" not in output and "true" not in output:
            print("La table n'existe pas")
            print("Sortie:", output)
            return
        """

        print(f"✔ Utilisation de la table existante '{table_name}'")

        # ÉTAPE 1: Transfert du CSV vers la VM
        sftp.put(local_csv_path, remote_csv_path)
        print(f"✔ Fichier CSV transféré vers {remote_csv_path}")

        # ÉTAPE 2: Préparation des commandes PUT
        with sftp.file(remote_cmd_file, 'w') as f:
            with open(local_csv_path, 'r') as csvfile:
                reader = csv.DictReader(csvfile)
                
                # Choix du row_key (colonne 'id' ou première colonne)
                row_key_field = 'id' if 'id' in reader.fieldnames else reader.fieldnames[0]
                print(f"Utilisation de la colonne '{row_key_field}' comme clé de ligne")
                
                for row_num, row in enumerate(reader, 1):
                    row_key = row[row_key_field]
                    
                    # Génération des commandes PUT
                    for col, val in row.items():
                        if col != row_key_field:
                            # Échappement des caractères spéciaux
                            safe_val = str(val).replace("'", "\\'").replace('\n', ' ')
                            f.write(f"put '{table_name}', '{row_key}', '{column_family}:{col}', '{safe_val}'\n")
                    
                    # Feedback progression
                    if row_num % 100 == 0:
                        print(f"Lignes traitées: {row_num}")
            
            f.write("exit\n")

        # ÉTAPE 3: Exécution des commandes
        print("Début de l'insertion des données...")
        stdin, stdout, stderr = ssh.exec_command(f"hbase shell {remote_cmd_file}")
        
        # Attendre la fin de l'exécution
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status == 0:
            print(f"✔ Insertion réussie dans '{table_name}'")
            
            # Vérification (optionnelle)
            stdin, stdout, stderr = ssh.exec_command(
                f"echo \"scan '{table_name}', {{'LIMIT' => 3}}\" | hbase shell -n")
            print("\nAperçu des données insérées:")
            print(stdout.read().decode().split('ROW')[1][:500] + "...")  # Aperçu court
        else:
            error = stderr.read().decode()
            print(f"✖ Erreur lors de l'insertion (code {exit_status})")
            if error:
                print("Détails:", error[:500])  # Affiche un extrait de l'erreur

    except Exception as e:
        print(f"Erreur inattendue: {str(e)}")
    finally:
        sftp.close()
        ssh.close()
        print("Connexions fermées")

if _name_ == "_main_":
    load_csv_to_hbase()