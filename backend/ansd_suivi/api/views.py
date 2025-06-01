# api/views.py
from django.db.models import Count, Q, Sum, Case, When, IntegerField, FloatField
from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination # <--- Importation nécessaire

from .models import Region, Superviseur, Enqueteur, Menage
from .serializers import (
    RegionSerializer, SuperviseurSerializer, EnqueteurSerializer,
    MenageSerializer, MenageListSerializer
)

# --- Classe de Pagination Standard (peut être réutilisée ou définie globalement) ---
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10  # Nombre d'éléments par page par défaut
    page_size_query_param = 'page_size' # Permet au client de spécifier la taille via ?page_size=X
    max_page_size = 100 # Taille de page maximale autorisée pour éviter les abus


# --- ViewSets pour la gestion CRUD (si nécessaire via l'API) ---
class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour lister et récupérer les Régions (DR).
    """
    queryset = Region.objects.all().order_by('code_dr')
    serializer_class = RegionSerializer
    # Pas besoin de pagination ici si la liste des régions est courte,
    # sinon, ajoutez pagination_class = StandardResultsSetPagination


class EnqueteurViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour lister et récupérer les Enquêteurs.
    """
    queryset = Enqueteur.objects.all().order_by('nom_enqueteur')
    serializer_class = EnqueteurSerializer
    pagination_class = StandardResultsSetPagination # Pagination pour la liste des enquêteurs


class MenageViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les opérations CRUD sur les Ménages.
    La liste est paginée.
    """
    queryset = Menage.objects.select_related('region', 'enqueteur').order_by('idmng') # Ordonnancement important pour la pagination
    serializer_class = MenageSerializer # Utilisé pour retrieve, create, update, partial_update, destroy
    filterset_fields = ['region__code_dr', 'statut_menage', 'enqueteur__login_enq', 'superviseur_code', 'is_rural']
    pagination_class = StandardResultsSetPagination # <--- Ajout de la pagination ici

    def get_serializer_class(self):
        """
        Utilise MenageListSerializer pour l'action 'list' (plus léger)
        et MenageSerializer pour les autres actions.
        """
        if self.action == 'list':
            return MenageListSerializer
        return super().get_serializer_class()


# --- Vues API pour les Statistiques et Rapports ---

class GlobalStatsAPIView(APIView):
    """
    Vue API pour récupérer les statistiques globales des enquêtes.
    """
    def get(self, request, *args, **kwargs):
        # Ménages attendus (ceux marqués dans le tirage, tirage=1)
        menages_attendus_qs = Menage.objects.filter(tirage=1)
        total_menages_attendus = menages_attendus_qs.count()
        rural_attendus = menages_attendus_qs.filter(is_rural=True).count()
        urbain_attendus = menages_attendus_qs.filter(is_rural=False).count() # ou total_menages_attendus - rural_attendus

        # Ménages collectés (Statut COMPLET ou PARTIEL)
        menages_collectes_qs = Menage.objects.filter(
            Q(statut_menage=Menage.STATUT_COMPLET) | Q(statut_menage=Menage.STATUT_PARTIEL)
        )
        total_menages_collectes = menages_collectes_qs.count()
        rural_collectes = menages_collectes_qs.filter(is_rural=True).count()
        urbain_collectes = menages_collectes_qs.filter(is_rural=False).count() # ou total_menages_collectes - rural_collectes

        # Calcul des taux de couverture
        taux_couverture_global = (total_menages_attendus / total_menages_collectes * 100) if total_menages_attendus > 0 else 0
        taux_couverture_rural = (rural_attendus / rural_collectes * 100) if rural_attendus > 0 else 0
        taux_couverture_urbain = (urbain_collectes / urbain_attendus * 100) if urbain_attendus > 0 else 0

        # Répartition des statuts pour tous les ménages (pas seulement ceux du tirage)
        statuts_counts = Menage.objects.values('statut_menage').annotate(count=Count('idmng')).order_by('statut_menage')

        statuts_dict = {s[0]: s[1] for s in Menage.STATUT_MENAGE_CHOICES}
        readable_statuts_counts = [
            {"statut_nom": statuts_dict.get(item['statut_menage'], f"Statut Inconnu ({item['statut_menage']})"), "count": item['count']}
            for item in statuts_counts
        ]

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
        # Pré-charger les noms des statuts pour éviter de recréer le dictionnaire dans la boucle
        statuts_dict = {s[0]: s[1] for s in Menage.STATUT_MENAGE_CHOICES}

        # Optimisation: utiliser annotate pour compter directement au lieu de boucler et filtrer N fois
        # Cela nécessiterait une refonte plus importante de la requête si l'on veut tout en une seule.
        # Pour l'instant, on garde la boucle pour la clarté, mais attention aux performances si beaucoup de régions.
        regions = Region.objects.all().order_by('code_dr')

        for region in regions:
            menages_region_qs = Menage.objects.filter(region=region)

            attendus_region = menages_region_qs.filter(tirage=1).count()
            collectes_region = menages_region_qs.filter(
                Q(statut_menage=Menage.STATUT_COMPLET) | Q(statut_menage=Menage.STATUT_PARTIEL)
            ).count()

            taux_couverture_region = (collectes_region / attendus_region * 100) if attendus_region > 0 else 0

            statuts_region_counts = menages_region_qs.values('statut_menage').annotate(count=Count('idmng')).order_by('statut_menage')
            readable_statuts_region_counts = [
                {"statut_nom": statuts_dict.get(item['statut_menage'], f"Statut Inconnu ({item['statut_menage']})"), "count": item['count']}
                for item in statuts_region_counts
            ]

            regions_data.append({
                "code_dr": region.code_dr,
                "nom_region": region.nom_region,
                "menages_attendus": attendus_region,
                "menages_collectes": collectes_region,
                "taux_de_couverture": round(taux_couverture_region, 2),
                "repartition_statuts": readable_statuts_region_counts,
            })

        return Response(regions_data)


class MenagesParStatutRegionAPIView(generics.ListAPIView):
    """
    Vue API pour lister les ménages filtrés par statut et/ou région.
    Utilise la pagination.
    """
    serializer_class = MenageListSerializer
    pagination_class = StandardResultsSetPagination # Cohérence de la pagination
    # filterset_fields est disponible pour les ViewSets, ici on filtre manuellement dans get_queryset

    def get_queryset(self):
        queryset = Menage.objects.select_related('region', 'enqueteur').all()

        code_dr = self.request.query_params.get('region__code_dr') # Correspond au nom du filtre frontend
        statut_menage_str = self.request.query_params.get('statut_menage') # Correspond au nom du filtre frontend

        if code_dr:
            queryset = queryset.filter(region__code_dr=code_dr)

        if statut_menage_str:
            try:
                statut_menage_int = int(statut_menage_str)
                queryset = queryset.filter(statut_menage=statut_menage_int)
            except ValueError:
                # Gérer le cas où statut_menage n'est pas un entier valide (ignorer le filtre ou lever une erreur)
                pass # Pour l'instant, on ignore si la valeur n'est pas un entier

        return queryset.order_by('idmng') # Important pour une pagination cohérente