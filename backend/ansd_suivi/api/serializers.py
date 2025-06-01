# api/serializers.py
from rest_framework import serializers
from .models import Region, Superviseur, Enqueteur, Menage

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['code_dr', 'nom_region']

class SuperviseurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Superviseur
        fields = ['id_superviseur'] # Ajoutez 'nom' etc. si vous les ajoutez au modèle

class EnqueteurSerializer(serializers.ModelSerializer):
    superviseur_id = serializers.CharField(source='superviseur.id_superviseur', read_only=True, allow_null=True)

    class Meta:
        model = Enqueteur
        fields = ['login_enq', 'nom_enqueteur', 'superviseur_id']

class MenageSerializer(serializers.ModelSerializer):
    region_nom = serializers.CharField(source='region.nom_region', read_only=True)
    enqueteur_nom = serializers.CharField(source='enqueteur.nom_enqueteur', read_only=True, allow_null=True)
    statut_menage_display = serializers.CharField(source='get_statut_menage_display', read_only=True)

    class Meta:
        model = Menage
        fields = [
            'idmng', 'region', 'region_nom', 'superviseur_code', 
            'enqueteur', 'enqueteur_nom', 'hh_trimestre', 'cons_code', 
            'num_men_csv', 'nom_cc', 'nom_cm', 'statut_menage', 'statut_menage_display',
            'tirage', 'adresse', 'telephone1', 'taille_men', 'nbr_eligible',
            'date_enquete', 'heure_debut_enquete', 'heure_fin_enquete',
            'observations', 'is_rural'
        ]
        # Pour permettre de créer/mettre à jour en fournissant juste les IDs des FK
        extra_kwargs = {
            'region': {'write_only': True}, 
            'enqueteur': {'write_only': True, 'required': False, 'allow_null': True},
        }
        
class MenageListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les listes"""
    region_nom = serializers.CharField(source='region.nom_region', read_only=True)
    statut_menage_display = serializers.CharField(source='get_statut_menage_display', read_only=True)
    enqueteur_nom = serializers.CharField(source='enqueteur.nom_enqueteur', read_only=True, allow_null=True)

    class Meta:
        model = Menage
        fields = ['idmng', 'nom_cm', 'region_nom', 'statut_menage_display', 'enqueteur_nom', 'date_enquete']