import csv
from django.core.management.base import BaseCommand
from api.models import Region, Superviseur, Enqueteur, Menage 
from django.utils.dateparse import parse_date, parse_time
import traceback 

# Définition des régions 
REGIONS_MAPPING = {
    "01": "Dakar", "02": "Dakar",
    "03": "Diourbel", "04": "Fatick", "05": "Kaffrine", "06": "Kaolack",
    "07": "Kedougou", "08": "Kolda", "09": "Louga", "10": "Matam",
    "11": "Saint Louis", "12": "Sedhiou", "13": "Tambacounda",
    "14": "Thies", "15": "Thies",
    "16": "Ziguinchor",
}

# Fonction pour convertir les statuts textuels en codes numériques (au niveau du module)
def get_menage_statut_code(statut_textuel_csv):
    if not statut_textuel_csv: # Gérer les chaînes vides
        return Menage.STATUT_AFFECTE # Statut par défaut si le champ est vide
        
    statut_textuel_csv = statut_textuel_csv.strip().upper()
    if statut_textuel_csv == "COMPLET":
        return Menage.STATUT_COMPLET
    elif statut_textuel_csv == "PARTIEL":
        return Menage.STATUT_PARTIEL
    elif statut_textuel_csv == "REFUS":
        return Menage.STATUT_REFUS
    elif "EXISTE PLUS" in statut_textuel_csv: # Plus flexible
        return Menage.STATUT_N_EXISTE_PLUS
    elif "DÉMÉNAGÉ" in statut_textuel_csv or "DEMENAGE" in statut_textuel_csv:
        return Menage.STATUT_DEMENAGE
    # Si vous avez un statut "NON AFFECTE" textuel dans le CSV et que vous voulez le mapper:
    # elif statut_textuel_csv == "NON AFFECTE":
    #     return Menage.STATUT_NON_AFFECTE
    return Menage.STATUT_AFFECTE # Statut par défaut si non explicitement reconnu ou si le champ n'est pas dans le CSV


class Command(BaseCommand):
    help = 'Importe les données des fichiers CSV dans la base de données'

    def handle(self, *args, **options):
        self.stdout.write("Début de l'importation...")

        # 1. Créer/Mettre à jour les Régions
        for code, nom in REGIONS_MAPPING.items():
            Region.objects.update_or_create(code_dr=code, defaults={'nom_region': nom})
        self.stdout.write(self.style.SUCCESS('Régions importées/mises à jour.'))

        path_info_gen = 'INFO_GEN.CSV'
        path_info_men_record = 'INFO_MEN_RECORD.CSV'

        superviseurs_crees = set()
        enqueteurs_crees = {} # login_enq: objet Enqueteur

        # 2. Pré-traiter INFO_GEN.CSV pour les enquêteurs et superviseurs
        self.stdout.write(f"--- Lecture de {path_info_gen} pour Enquêteurs/Superviseurs ---")
        try:
            with open(path_info_gen, 'r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file, delimiter=';')
                if not reader.fieldnames:
                    self.stderr.write(self.style.ERROR(f"Aucun en-tête trouvé dans {path_info_gen}. Le fichier est-il vide ou mal formaté ?"))
                    return
                # self.stdout.write(f"En-têtes détectés dans INFO_GEN.CSV: {reader.fieldnames}") # Déjà affiché

                for i, row in enumerate(reader):
                    # if i < 2: # Déjà affiché
                    #     self.stdout.write(f"Ligne {i+1} INFO_GEN (brute): {row}")

                    login_enq = row.get('LOGIN_ENQ', '').strip()
                    nom_enqueteur = row.get('NOM_DE_L_ENQUETEUR', '').strip()
                    id_superviseur_gen = row.get('CP_SUPERVISEUR', '').strip() # De INFO_GEN

                    if id_superviseur_gen and id_superviseur_gen not in superviseurs_crees:
                        Superviseur.objects.get_or_create(id_superviseur=id_superviseur_gen)
                        superviseurs_crees.add(id_superviseur_gen)

                    if login_enq and nom_enqueteur:
                        superviseur_obj = Superviseur.objects.filter(id_superviseur=id_superviseur_gen).first()
                        enqueteur_obj, created = Enqueteur.objects.update_or_create(
                            login_enq=login_enq,
                            defaults={
                                'nom_enqueteur': nom_enqueteur,
                                'superviseur': superviseur_obj # Lier l'enquêteur à son superviseur
                                }
                        )
                        enqueteurs_crees[login_enq] = enqueteur_obj
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"Fichier {path_info_gen} non trouvé."))
            return
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur lors de la lecture de {path_info_gen} (Enquêteurs/Superviseurs): {e}"))
            traceback.print_exc()
            return
        
        self.stdout.write(self.style.SUCCESS(f'{len(enqueteurs_crees)} Enquêteurs lus/créés depuis INFO_GEN.'))
        self.stdout.write(self.style.SUCCESS(f'{len(superviseurs_crees)} Superviseurs uniques lus/créés depuis INFO_GEN.'))


        # 3. Traiter INFO_MEN_RECORD.CSV pour stocker ses données temporairement
        menages_data_from_men_record = {}
        self.stdout.write(f"--- Lecture de {path_info_men_record} pour données Ménages ---")
        try:
            with open(path_info_men_record, 'r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file, delimiter=';')
                if not reader.fieldnames:
                    self.stderr.write(self.style.ERROR(f"Aucun en-tête trouvé dans {path_info_men_record}. Le fichier est-il vide ou mal formaté ?"))
                    return
                # self.stdout.write(f"En-têtes détectés dans INFO_MEN_RECORD.CSV: {reader.fieldnames}") # Déjà affiché

                for i, row in enumerate(reader):
                    # if i < 2: # Déjà affiché
                    #     self.stdout.write(f"Ligne {i+1} INFO_MEN_RECORD (brute): {row}")
                    
                    idmng = row.get('idmng', '').strip()
                    if not idmng: 
                        continue

                    # Superviseurs depuis INFO_MEN_RECORD (s'ils n'ont pas été lus depuis INFO_GEN)
                    id_superviseur_men = row.get('SUPERVISEUR', '').strip()
                    if id_superviseur_men and id_superviseur_men not in superviseurs_crees:
                        Superviseur.objects.get_or_create(id_superviseur=id_superviseur_men)
                        superviseurs_crees.add(id_superviseur_men)

                    menages_data_from_men_record[idmng] = {
                        'hh_trimestre': row.get('HH_TRIMESTRE', '').strip(),
                        'superviseur_code': id_superviseur_men if id_superviseur_men else None,
                        'dr_code': row.get('DR', '').strip()[:2], # DR de INFO_MEN_RECORD est souvent le code long (grappe)
                        'cons_code': row.get('CONS', '').strip(), # CONS de INFO_MEN_RECORD est le code court (comme CP_CONS)
                        'num_men_csv': row.get('NUM_MEN', '').strip(),
                        'nom_cc_men_record': row.get('NOM_CC', '').strip(),
                        'nom_cm_men_record': row.get('NOM_DU_CM', '').strip(),
                        'statut_textuel_men_record': row.get('STATUT', '').strip(),
                        'tirage_men_record': row.get('TIRAGE', '0').strip(),
                        'ech_adresse': row.get('ECH_ADRESSE', '').strip(),
                        'ech_telephone': row.get('ECH_NUMERO_TELEPHONE', '').strip(),
                        'owner_id_men_record': row.get('OWNER_ID', '').strip(), # Souvent le login de l'enquêteur
                        'owner_name_men_record': row.get('OWNER_NAME', '').strip(), # Nom de l'enquêteur
                    }
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"Fichier {path_info_men_record} non trouvé."))
            return
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur lors de la lecture de {path_info_men_record} (données Ménages): {e}"))
            traceback.print_exc()
            return
        
        self.stdout.write(self.style.SUCCESS(f'{len(menages_data_from_men_record)} ménages pré-lus depuis INFO_MEN_RECORD.'))


        # 4. Importer/Mettre à jour les Ménages en combinant les infos de INFO_GEN (prioritaire pour certains champs)
        # et INFO_MEN_RECORD
        count_created = 0
        count_updated = 0
        self.stdout.write(f"--- Combinaison et Importation Finale des Ménages (source principale INFO_GEN) ---")
        try:
            with open(path_info_gen, 'r', encoding='utf-8-sig') as file:
                reader = csv.DictReader(file, delimiter=';')
                if not reader.fieldnames: 
                    self.stderr.write(self.style.ERROR(f"Aucun en-tête trouvé dans {path_info_gen} pour l'import final."))
                    return

                for i, row_gen in enumerate(reader):
                    idmng = row_gen.get('idmng', '').strip()
                    if not idmng:
                        continue
                    
                    data_men_record = menages_data_from_men_record.get(idmng, {}) # Données de INFO_MEN_RECORD pour ce ménage
                    
                    # Détermination du code DR:
                    # Priorité à DR de INFO_MEN_RECORD s'il est renseigné et valide, sinon CP_GRAPPE de INFO_GEN
                    dr_code_final = data_men_record.get('dr_code') # DR de INFO_MEN_RECORD est le code long
                    if dr_code_final and len(dr_code_final) >=2 :
                        dr_code_final = dr_code_final[:2] # On prend les 2 premiers caractères
                    else: 
                        dr_code_from_gen = row_gen.get('CP_GRAPPE', '').strip() # Ex: 011301120004
                        if dr_code_from_gen and len(dr_code_from_gen) >= 2:
                             dr_code_final = dr_code_from_gen[:2]
                        else:
                            self.stdout.write(self.style.WARNING(f"Code DR non trouvé/valide pour ménage {idmng}. DR_MEN_REC: '{data_men_record.get('dr_code')}', CP_GRAPPE_GEN: '{dr_code_from_gen}'. Skipping."))
                            continue

                    region_obj = Region.objects.filter(code_dr=dr_code_final).first()
                    if not region_obj:
                        self.stdout.write(self.style.WARNING(f"Région non trouvée pour DR code '{dr_code_final}' (Ménage {idmng}). Skipping."))
                        continue
                    
                    # Détermination de l'enquêteur
                    # Priorité à LOGIN_ENQ de INFO_GEN, sinon OWNER_ID de INFO_MEN_RECORD
                    login_enq_final = row_gen.get('LOGIN_ENQ', '').strip()
                    if not login_enq_final:
                        login_enq_final = data_men_record.get('owner_id_men_record', '').strip()
                    
                    enqueteur_obj = enqueteurs_crees.get(login_enq_final) # Récupère l'objet Enqueteur déjà créé

                    # Statut du ménage: Priorité à STATUT de INFO_MEN_RECORD
                    statut_menage_code = get_menage_statut_code(data_men_record.get('statut_textuel_men_record'))
                    
                    # Tirage: Priorité à TIRAGE de INFO_MEN_RECORD
                    try:
                        tirage_val_str = data_men_record.get('tirage_men_record', '0').strip()
                        tirage_val = int(float(tirage_val_str)) if tirage_val_str else 0
                    except (ValueError, TypeError):
                        tirage_val = 0 # Par défaut si non convertible

                    # Dates et Heures: Priorité à INFO_GEN
                    date_enquete_val = parse_date(row_gen.get('DATE_ENQ_HUMAN', '').strip())
                    heure_debut_str = (row_gen.get('HEUR_DEBUT', '') or row_gen.get('HEUR_DEBISTATUT', '')).strip()
                    heure_debut_val = parse_time(heure_debut_str) if heure_debut_str else None
                    heure_fin_val = parse_time(row_gen.get('HEUR_FIN', '').strip())

                    # Superviseur: Priorité à CP_SUPERVISEUR de INFO_GEN, sinon SUPERVISEUR de INFO_MEN_RECORD
                    superviseur_code_final = row_gen.get('CP_SUPERVISEUR', '').strip()
                    if not superviseur_code_final:
                        superviseur_code_final = data_men_record.get('superviseur_code', '').strip()
                    
                    # Champs de base: Priorité à INFO_GEN si présents, sinon INFO_MEN_RECORD
                    hh_trimestre_final = row_gen.get('CP_TRIMESTRE', '').strip() or data_men_record.get('hh_trimestre', '')
                    cons_code_final = row_gen.get('CP_CONS', '').strip() or data_men_record.get('cons_code', '') # CP_CONS est le code court
                    num_men_csv_final = row_gen.get('CP_MEN', '').strip() or data_men_record.get('num_men_csv', '')
                    nom_cc_final = row_gen.get('CP_NOM_CC', '').strip() or data_men_record.get('nom_cc_men_record', '')
                    nom_cm_final = row_gen.get('NOM_CM', '').strip() or data_men_record.get('nom_cm_men_record', '')
                    
                    # Adresse et Tel: Priorité à ECH_... de INFO_MEN_RECORD, sinon INFO_GEN
                    adresse_final = data_men_record.get('ech_adresse', '').strip() or row_gen.get('ADRESSE', '').strip() or row_gen.get('CON_ROST', '').strip()
                    telephone_final = data_men_record.get('ech_telephone', '').strip() or row_gen.get('NUM_TEL1', '').strip()

                    # Taille et Nbr Eligible: Uniquement depuis INFO_GEN (selon votre cahier des charges implicite)
                    taille_men_str = row_gen.get('TAILLE_MEN', '0').strip()
                    nbr_eligible_str = row_gen.get('NBR_ELIGIBLE', '0').strip()

                    try:
                        taille_men_val = int(taille_men_str) if taille_men_str else 0
                    except ValueError:
                        self.stdout.write(self.style.WARNING(f"Valeur invalide pour TAILLE_MEN: '{taille_men_str}' pour idmng {idmng}. Utilisation de 0."))
                        taille_men_val = 0
                    
                    try:
                        nbr_eligible_val = int(nbr_eligible_str) if nbr_eligible_str else 0
                    except ValueError:
                        self.stdout.write(self.style.WARNING(f"Valeur invalide pour NBR_ELIGIBLE: '{nbr_eligible_str}' pour idmng {idmng}. Utilisation de 0."))
                        nbr_eligible_val = 0
                    
                    # Déterminer si rural/urbain basé sur le code DR final
                    is_rural_val = region_obj.code_dr in ["03", "05", "07", "08", "09", "10", "12", "13"]

                    menage_defaults = {
                        'region': region_obj,
                        'superviseur_code': superviseur_code_final if superviseur_code_final else None,
                        'enqueteur': enqueteur_obj,
                        'hh_trimestre': hh_trimestre_final.strip(),
                        'cons_code': cons_code_final.strip(), 
                        'num_men_csv': num_men_csv_final.strip(),
                        'nom_cc': nom_cc_final.strip(),
                        'nom_cm': nom_cm_final.strip(),
                        'statut_menage': statut_menage_code,
                        'tirage': tirage_val,
                        'adresse': adresse_final.strip(),
                        'telephone1': telephone_final.strip(),
                        'taille_men': taille_men_val,
                        'nbr_eligible': nbr_eligible_val,
                        'date_enquete': date_enquete_val,
                        'heure_debut_enquete': heure_debut_val,
                        'heure_fin_enquete': heure_fin_val,
                        'observations': row_gen.get('OBS', '').strip(),
                        'is_rural': is_rural_val
                    }
                    
                    menage, created = Menage.objects.update_or_create(
                        idmng=idmng,
                        defaults=menage_defaults
                    )
                    if created:
                        count_created += 1
                    else:
                        count_updated += 1
                        
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"Fichier {path_info_gen} non trouvé pour l'import final des ménages."))
            return
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur lors de l'importation des ménages (combinaison INFO_GEN/INFO_MEN_RECORD): {e}"))
            traceback.print_exc()
            return

        self.stdout.write(self.style.SUCCESS(f'{count_created} ménages créés, {count_updated} ménages mis à jour.'))
        self.stdout.write(self.style.SUCCESS('Importation terminée.'))