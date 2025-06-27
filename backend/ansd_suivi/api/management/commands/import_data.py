# api/management/commands/import_data.py
import csv
from django.core.management.base import BaseCommand
from api.models import Region, Superviseur, Enqueteur, Menage
from django.utils.dateparse import parse_date, parse_time
import traceback

REGIONS_MAPPING = {
    "01": "DAKAR", "02": "ZIGUINCHOR", "03": "DIOURBEL", "04": "SAINT-LOUIS",
    "05": "TAMBACOUNDA", "06": "KAOLACK", "07": "THIES", "08": "LOUGA",
    "09": "FATICK", "10": "KOLDA", "11": "MATAM", "12": "KAFFRINE",
    "13": "KEDOUGOU", "14": "SEDHIOU",
}

def get_menage_statut_code(statut_textuel_csv):
    if not statut_textuel_csv: return Menage.STATUT_AFFECTE
    statut_textuel_csv = statut_textuel_csv.strip().upper()
    if statut_textuel_csv == "COMPLET": return Menage.STATUT_COMPLET
    elif statut_textuel_csv == "PARTIEL": return Menage.STATUT_PARTIEL
    elif statut_textuel_csv == "REFUS": return Menage.STATUT_REFUS
    elif "EXISTE PLUS" in statut_textuel_csv: return Menage.STATUT_N_EXISTE_PLUS
    elif "DÉMÉNAGÉ" in statut_textuel_csv or "DEMENAGE" in statut_textuel_csv: return Menage.STATUT_DEMENAGE
    elif statut_textuel_csv == "NON AFFECTÉ" or statut_textuel_csv == "NON AFFECTE": return Menage.STATUT_NON_AFFECTE
    return Menage.STATUT_AFFECTE

class Command(BaseCommand):
    help = 'Supprime les anciennes données et importe les nouvelles depuis les fichiers CSV.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Début de l'opération d'importation et de rafraîchissement des données..."))

        self.stdout.write(self.style.WARNING("Suppression des anciennes données..."))
        try:
            Menage.objects.all().delete()
            Enqueteur.objects.all().delete()
            Superviseur.objects.all().delete()
            Region.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("  Anciennes données (Ménages, Enquêteurs, Superviseurs, Régions) supprimées."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur lors de la suppression des anciennes données: {e}"))
            traceback.print_exc()
            return
        self.stdout.write(self.style.SUCCESS("Suppression terminée."))

        for code, nom in REGIONS_MAPPING.items():
            Region.objects.get_or_create(code_dr=code, defaults={'nom_region': nom})
        self.stdout.write(self.style.SUCCESS('Régions importées/mises à jour.'))

        path_info_gen = 'INFO_GEN.CSV'
        path_info_men_record = 'INFO_MEN_RECORD.CSV'
        superviseurs_crees_par_id = {}
        enqueteurs_crees_par_login = {}

        self.stdout.write(f"--- Lecture de {path_info_gen} pour Enquêteurs/Superviseurs ---")
        try:
            with open(path_info_gen, 'r', encoding='utf-8-sig', errors='replace') as file:
                reader = csv.DictReader(file, delimiter=',')
                if not reader.fieldnames:
                    self.stderr.write(self.style.ERROR(f"Aucun en-tête trouvé dans {path_info_gen}."))
                    return
                # self.stdout.write(f"En-têtes INFO_GEN: {reader.fieldnames}")

                for row in reader:
                    id_superviseur_gen = row.get('cp_superviseur', '').strip()
                    if id_superviseur_gen and id_superviseur_gen not in superviseurs_crees_par_id:
                        sup_obj, _ = Superviseur.objects.get_or_create(id_superviseur=id_superviseur_gen)
                        superviseurs_crees_par_id[id_superviseur_gen] = sup_obj

                    login_enq = row.get('login_enq', '').strip()
                    nom_enqueteur = row.get('nom_de_l_enqueteur', '').strip()
                    if login_enq and nom_enqueteur:
                        superviseur_obj = superviseurs_crees_par_id.get(id_superviseur_gen)
                        enq_obj, _ = Enqueteur.objects.get_or_create(
                            login_enq=login_enq,
                            defaults={'nom_enqueteur': nom_enqueteur, 'superviseur': superviseur_obj}
                        )
                        enqueteurs_crees_par_login[login_enq] = enq_obj
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur lecture {path_info_gen} (Enq/Sup): {e}"))
            traceback.print_exc(); return
        self.stdout.write(self.style.SUCCESS(f'{len(enqueteurs_crees_par_login)} Enquêteurs traités.'))
        self.stdout.write(self.style.SUCCESS(f'{len(superviseurs_crees_par_id)} Superviseurs traités.'))

        menages_data_from_men_record = {}
        self.stdout.write(f"--- Lecture de {path_info_men_record} pour données Ménages ---")
        try:
            with open(path_info_men_record, 'r', encoding='utf-8-sig', errors='replace') as file:
                reader = csv.DictReader(file, delimiter=',')
                if not reader.fieldnames:
                    self.stderr.write(self.style.ERROR(f"Aucun en-tête trouvé dans {path_info_men_record}."))
                    return
                # self.stdout.write(f"En-têtes INFO_MEN_RECORD: {reader.fieldnames}")
                for row in reader:
                    idmng = row.get('idmng', '').strip()
                    if not idmng: continue
                    id_superviseur_men = row.get('superviseur', '').strip()
                    if id_superviseur_men and id_superviseur_men not in superviseurs_crees_par_id:
                        sup_obj, _ = Superviseur.objects.get_or_create(id_superviseur=id_superviseur_men)
                        superviseurs_crees_par_id[id_superviseur_men] = sup_obj
                    owner_id_men_record = row.get('owner_id', '').strip()
                    owner_name_men_record = row.get('owner_name', '').strip()
                    if owner_id_men_record and owner_id_men_record not in enqueteurs_crees_par_login:
                        superviseur_pour_owner = superviseurs_crees_par_id.get(id_superviseur_men)
                        enq_obj, _ = Enqueteur.objects.get_or_create(
                            login_enq=owner_id_men_record,
                            defaults={'nom_enqueteur': owner_name_men_record or owner_id_men_record, 'superviseur': superviseur_pour_owner }
                        )
                        enqueteurs_crees_par_login[owner_id_men_record] = enq_obj
                    menages_data_from_men_record[idmng] = {
                        'hh_trimestre': row.get('hh_trimestre', '').strip(),
                        'superviseur_code_men_rec': id_superviseur_men,
                        'dr_code_long': row.get('dr', '').strip(),
                        'cons_code': row.get('cons', '').strip(),
                        'num_men_csv': row.get('num_men', '').strip(),
                        'nom_cc_men_record': row.get('nom_cc', '').strip(),
                        'nom_cm_men_record': row.get('nom_du_cm', '').strip(),
                        'statut_textuel_men_record': row.get('statut', '').strip(),
                        'tirage_men_record': row.get('tirage', '').strip(), # Enlever la valeur par défaut '0'
                        'ech_adresse': row.get('ech_adresse', '').strip(),
                        'ech_telephone': row.get('ech_numero_telephone', '').strip(),
                        'owner_id_men_record': owner_id_men_record,
                    }
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur lecture {path_info_men_record} (Ménages): {e}"))
            traceback.print_exc(); return
        self.stdout.write(self.style.SUCCESS(f'{len(menages_data_from_men_record)} entrées ménages depuis INFO_MEN_RECORD.'))

        count_created = 0
        idmngs_deja_importes = set()
        self.stdout.write(f"--- Importation des Ménages (source principale INFO_GEN) ---")
        try:
            with open(path_info_gen, 'r', encoding='utf-8-sig', errors='replace') as file:
                reader = csv.DictReader(file, delimiter=',')
                if not reader.fieldnames:
                    self.stderr.write(self.style.ERROR(f"Aucun en-tête trouvé dans {path_info_gen} pour import final."))
                    return

                for i, row_gen in enumerate(reader):
                    idmng = row_gen.get('idmng', '').strip()
                    if not idmng: continue
                    if idmng in idmngs_deja_importes: continue
                    
                    data_men_rec = menages_data_from_men_record.get(idmng, {})

                    dr_code_long_men_rec = data_men_rec.get('dr_code_long', '').strip()
                    dr_code_gen_grappe = row_gen.get('cp_grappe', '').strip()
                    dr_code_final_brut = None

                    if dr_code_long_men_rec and len(dr_code_long_men_rec) >= 2:
                        dr_code_final_brut = dr_code_long_men_rec[:2]
                    elif dr_code_gen_grappe and len(dr_code_gen_grappe) >= 2:
                        dr_code_final_brut = dr_code_gen_grappe[:2]
                    
                    dr_code_final = None
                    if dr_code_final_brut:
                        cleaned_code = dr_code_final_brut.strip("'\" ")
                        if len(cleaned_code) == 1 and cleaned_code.isdigit():
                            dr_code_final = f"0{cleaned_code}"
                        elif len(cleaned_code) == 2 and cleaned_code.isdigit():
                            dr_code_final = cleaned_code
                        else: continue
                    if not dr_code_final: continue
                    region_obj = Region.objects.filter(code_dr=dr_code_final).first()
                    if not region_obj: continue

                    login_enq_gen = row_gen.get('login_enq', '').strip()
                    owner_id_men_rec = data_men_rec.get('owner_id_men_record', '')
                    enqueteur_obj = enqueteurs_crees_par_login.get(login_enq_gen) or enqueteurs_crees_par_login.get(owner_id_men_rec)
                    
                    statut_menage_code = get_menage_statut_code(data_men_rec.get('statut_textuel_men_record'))
                    
                    # CORRECTION POUR TIRÉ ET REMPLAÇANT
                    valeur_tirage_csv = data_men_rec.get('tirage_men_record', '').strip().lower()
                    tirage_val = 0
                    if 'remplaçant' in valeur_tirage_csv or 'tiré' in valeur_tirage_csv:
                        tirage_val = 1
                    
                    superviseur_code_final = row_gen.get('cp_superviseur', '').strip()
                    if not superviseur_code_final: superviseur_code_final = data_men_rec.get('superviseur_code_men_rec', '')
                    
                    date_enquete_val = parse_date(row_gen.get('date_enq_human', '').strip())
                    heure_debut_str_brute = (row_gen.get('heur_debut', '') or row_gen.get('heur_debistatut', '')).strip()
                    heure_fin_str_brute = row_gen.get('heur_fin', '').strip()
                    heure_debut_val = parse_time(heure_debut_str_brute) if heure_debut_str_brute else None
                    heure_fin_val = parse_time(heure_fin_str_brute) if heure_fin_str_brute else None
                    
                    is_rural_val = region_obj.nom_region.upper() not in ["DAKAR", "THIES"] 

                    menage_defaults = {
                        'region': region_obj, 'superviseur_code': superviseur_code_final, 'enqueteur': enqueteur_obj,
                        'hh_trimestre': (row_gen.get('cp_trimestre', '') or data_men_rec.get('hh_trimestre', '')).strip(),
                        'cons_code': (row_gen.get('cp_cons', '') or data_men_rec.get('cons_code', '')).strip(),
                        'num_men_csv': (row_gen.get('cp_men', '') or data_men_rec.get('num_men_csv', '')).strip(),
                        'nom_cc': (row_gen.get('cp_nom_cc', '') or data_men_rec.get('nom_cc_men_record', '')).strip(),
                        'nom_cm': (row_gen.get('nom_cm', '') or data_men_rec.get('nom_cm_men_record', '')).strip(),
                        'statut_menage': statut_menage_code, 'tirage': tirage_val,
                        'adresse': (data_men_rec.get('ech_adresse', '') or row_gen.get('adresse', '') or row_gen.get('con_rost', '')).strip(),
                        'telephone1': (data_men_rec.get('ech_telephone', '') or row_gen.get('num_tel1', '')).strip(),
                        'taille_men': int(row_gen.get('taille_men', '0').strip() or '0'),
                        'nbr_eligible': int(row_gen.get('nbr_eligible', '0').strip() or '0'),
                        'date_enquete': date_enquete_val, 'heure_debut_enquete': heure_debut_val,
                        'heure_fin_enquete': heure_fin_val, 'observations': row_gen.get('obs', '').strip(),
                        'is_rural': is_rural_val
                    }
                    Menage.objects.create(idmng=idmng, **menage_defaults)
                    idmngs_deja_importes.add(idmng)
                    count_created += 1
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"Fichier {path_info_gen} non trouvé."))
            return
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur importation ménages: {e} (ligne idmng: {idmng if 'idmng' in locals() else 'inconnu'})"))
            traceback.print_exc()
            return
        self.stdout.write(self.style.SUCCESS(f'{count_created} ménages créés.'))
        self.stdout.write(self.style.SUCCESS('Importation et rafraîchissement terminés.'))