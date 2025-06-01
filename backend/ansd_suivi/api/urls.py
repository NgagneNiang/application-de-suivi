# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegionViewSet, EnqueteurViewSet, MenageViewSet,
    GlobalStatsAPIView, RegionStatsAPIView, MenagesParStatutRegionAPIView
)

router = DefaultRouter()
router.register(r'regions', RegionViewSet)
router.register(r'enqueteurs', EnqueteurViewSet)
router.register(r'menages', MenageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stats/global/', GlobalStatsAPIView.as_view(), name='global-stats'),
    path('stats/regions/', RegionStatsAPIView.as_view(), name='region-stats'),
    path('menages-details/', MenagesParStatutRegionAPIView.as_view(), name='menages-par-statut-region'),
]