# api/admin.py
from django.contrib import admin
from .models import Region, Superviseur, Enqueteur, Menage

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('code_dr', 'nom_region')
    search_fields = ('nom_region', 'code_dr')

@admin.register(Superviseur)
class SuperviseurAdmin(admin.ModelAdmin):
    list_display = ('id_superviseur',) # Ajoutez 'nom' si présent
    search_fields = ('id_superviseur',)

@admin.register(Enqueteur)
class EnqueteurAdmin(admin.ModelAdmin):
    list_display = ('login_enq', 'nom_enqueteur', 'superviseur')
    list_filter = ('superviseur',)
    search_fields = ('login_enq', 'nom_enqueteur')

@admin.register(Menage)
class MenageAdmin(admin.ModelAdmin):
    list_display = ('idmng', 'nom_cm', 'region', 'enqueteur', 'statut_menage', 'is_rural', 'tirage', 'date_enquete')
    list_filter = ('statut_menage', 'region', 'is_rural', 'tirage', 'enqueteur', 'superviseur_code')
    search_fields = ('idmng', 'nom_cm', 'enqueteur__nom_enqueteur')
    # raw_id_fields = ('region', 'enqueteur') # Utile si beaucoup de choix
    fieldsets = (
        (None, {
            'fields': ('idmng', 'nom_cm', 'taille_men', 'nbr_eligible')
        }),
        ('Localisation & Affectation', {
            'fields': ('region', 'adresse', 'superviseur_code', 'enqueteur', 'cons_code', 'num_men_csv', 'is_rural')
        }),
        ('Statut & Enquête', {
            'fields': ('statut_menage', 'tirage', 'date_enquete', 'heure_debut_enquete', 'heure_fin_enquete', 'hh_trimestre')
        }),
        ('Contact & Observations', {
            'fields': ('telephone1', 'observations')
        }),
    )