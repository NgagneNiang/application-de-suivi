# api/views.py
from django.db.models import Count, Q
from rest_framework import viewsets, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Region, Superviseur, Enqueteur, Menage
from .serializers import (
    RegionSerializer, SuperviseurSerializer, EnqueteurSerializer,
    MenageSerializer, MenageListSerializer
)

# --- Classe de Pagination Standard (peut être réutilisée ou définie globalement) ---
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10  # Nombre d'éléments par page par défaut pour les listes paginées
    page_size_query_param = 'page_size' # Permet au client de spécifier la taille via ?page_size=X
    max_page_size = 100 # Taille de page maximale autorisée

# --- ViewSets ---
class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour lister et récupérer les Régions (DR).
    Pagination désactivée car la liste est généralement courte.
    """
    queryset = Region.objects.all().order_by('code_dr')
    serializer_class = RegionSerializer
    pagination_class = None  # Important: Pas de pagination pour cette liste


class EnqueteurViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour lister et récupérer les Enquêteurs.
    """
    queryset = Enqueteur.objects.select_related('superviseur').all().order_by('nom_enqueteur')
    serializer_class = EnqueteurSerializer
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['superviseur__id_superviseur'] # Permet de filtrer les enquêteurs par superviseur


class MenageViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les opérations CRUD sur les Ménages.
    La liste est paginée et filtrable.
    """
    queryset = Menage.objects.select_related('region', 'enqueteur__superviseur').order_by('idmng')
    serializer_class = MenageSerializer # Utilisé par défaut
    filterset_fields = { # Configuration plus explicite pour django-filter
        'region__code_dr': ['exact'],
        'statut_menage': ['exact'],
        'enqueteur__login_enq': ['exact'],
        'superviseur_code': ['exact'], # Si 'superviseur_code' est sur le modèle Menage
        # Ou si vous liez directement au superviseur via l'enquêteur :
        # 'enqueteur__superviseur__id_superviseur': ['exact'],
        'is_rural': ['exact'],
        'tirage': ['exact']
    }
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return MenageListSerializer
        return super().get_serializer_class()


# --- Vues API pour les Statistiques et Rapports ---
class GlobalStatsAPIView(APIView):
    """
    Vue API pour récupérer les statistiques globales des enquêtes.
    """
    def get(self, request, *args, **kwargs):
        menages_attendus_qs = Menage.objects.filter(tirage=1)
        total_menages_attendus = menages_attendus_qs.count()
        rural_attendus = menages_attendus_qs.filter(is_rural=True).count()
        urbain_attendus = total_menages_attendus - rural_attendus

        menages_collectes_qs = Menage.objects.filter(
            Q(statut_menage=Menage.STATUT_COMPLET) | Q(statut_menage=Menage.STATUT_PARTIEL)
        )
        total_menages_collectes = menages_collectes_qs.count()
        rural_collectes = menages_collectes_qs.filter(is_rural=True).count()
        urbain_collectes = total_menages_collectes - rural_collectes

        taux_couverture_global = ((total_menages_collectes / total_menages_attendus) * 100) if total_menages_attendus > 0 else 0
        taux_couverture_rural = ((rural_collectes / rural_attendus) * 100) if rural_attendus > 0 else 0
        taux_couverture_urbain = ((urbain_collectes / urbain_attendus) * 100) if urbain_attendus > 0 else 0
        
        # Récupérer tous les statuts possibles pour s'assurer que même ceux avec un compte de 0 sont listés si nécessaire
        all_statuts_choices = dict(Menage.STATUT_MENAGE_CHOICES)
        statuts_counts_db = Menage.objects.values('statut_menage').annotate(count=Count('idmng')).order_by('statut_menage')

        # Convertir en un dictionnaire pour un accès facile
        counts_map = {item['statut_menage']: item['count'] for item in statuts_counts_db}

        readable_statuts_counts = []
        for code, nom in all_statuts_choices.items():
            readable_statuts_counts.append({
                "statut_code": code, # Utile pour le frontend si besoin de filtrer par code
                "statut_nom": nom,
                "count": counts_map.get(code, 0) # Mettre 0 si le statut n'a pas de ménages
            })
        # Trier par code pour un ordre cohérent
        readable_statuts_counts.sort(key=lambda x: x['statut_code'])


        data = {
            "menages_attendus": {
                "total": total_menages_attendus,
                "rural": rural_attendus,
                "urbain": urbain_attendus,
            },
            "menages_collectes": {
                "total": total_menages_collectes,
                "rural": rural_collectes,
                "urbain": urbain_collectes,
            },
            "taux_de_couverture": {
                "global": round(taux_couverture_global, 2),
                "rural": round(taux_couverture_rural, 2),
                "urbain": round(taux_couverture_urbain, 2),
            },
            "repartition_statuts": readable_statuts_counts,
        }
        return Response(data)


class RegionStatsAPIView(APIView):
    """
    Vue API pour récupérer les statistiques d'enquête par région.
    """
    def get(self, request, *args, **kwargs):
        regions_data = []
        all_statuts_choices = dict(Menage.STATUT_MENAGE_CHOICES)
        regions = Region.objects.all().order_by('code_dr')

        for region in regions:
            menages_region_qs = Menage.objects.filter(region=region)

            attendus_region = menages_region_qs.filter(tirage=1).count()
            collectes_region = menages_region_qs.filter(
                Q(statut_menage=Menage.STATUT_COMPLET) | Q(statut_menage=Menage.STATUT_PARTIEL)
            ).count()

            taux_couverture_region = ((collectes_region / attendus_region) * 100) if attendus_region > 0 else 0 

            statuts_region_counts_db = menages_region_qs.values('statut_menage').annotate(count=Count('idmng')).order_by('statut_menage')
            counts_map_region = {item['statut_menage']: item['count'] for item in statuts_region_counts_db}
            
            readable_statuts_region_counts = []
            for code, nom in all_statuts_choices.items():
                 readable_statuts_region_counts.append({
                    "statut_code": code,
                    "statut_nom": nom,
                    "count": counts_map_region.get(code, 0)
                })
            readable_statuts_region_counts.sort(key=lambda x: x['statut_code'])
            
            regions_data.append({
                "code_dr": region.code_dr,
                "nom_region": region.nom_region,
                "menages_attendus": attendus_region,
                "menages_collectes": collectes_region,
                "taux_de_couverture": round(taux_couverture_region, 2),
                "repartition_statuts": readable_statuts_region_counts,
            })


        return Response(regions_data)



