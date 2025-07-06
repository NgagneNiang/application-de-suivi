// src/pages/DashboardPage.jsx
import React, { useState, useEffect,useMemo } from 'react';
import { Box, Grid, Typography, Paper, CircularProgress, Alert, Button, ButtonGroup, Stack } from '@mui/material';
// import StatCard from '../components/dashboard/StatCard'; // Assurez-vous que le chemin est correct
// import RegionProgress from '../components/dashboard/RegionProgress'; // Assurez-vous que le chemin est correct
// import MenagesTable from '../components/dashboard/MenagesTable'; // Assurez-vous que le chemin est correct
// import StatusPieChart from '../components/dashboard/StatusPieChart'; // Assurez-vous que le chemin est correct
import { useGetGlobalStatsQuery, useGetRegionStatsQuery, useGetRegionsQuery } from '../api/apiSlice'; // Ajustez le chemin si nécessaire

// Icônes pour les StatCards (optionnel, mais pour l'exemple)
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupIcon from '@mui/icons-material/Group';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import MenagesTable from '../dashboard/MenagesTable';
// import RegionProgress from './../dashboard/RegionProgress';
import RegionProgress from './../dashboard/RegionProgress';
import StatCard from '../dashboard/StatCard';
import StatusPieChart from '../dashboard/StatusPieChart';
import PublicIcon from '@mui/icons-material/Public';

const DashboardPage = () => {
    const {
        data: globalStats,
        isLoading: isLoadingGlobal,
        error: errorGlobal,
        isError: isErrorGlobal
    } = useGetGlobalStatsQuery();

    const {
        data: regionStatsData, // Tableau de statistiques pour chaque région
        isLoading: isLoadingRegionStats,
        error: errorRegionStats,
        isError: isErrorRegionStats
    } = useGetRegionStatsQuery();

    // Supposant que /api/regions/ renvoie un tableau direct (pas de pagination)
    const {
        data: regionsList,
        isLoading: isLoadingRegions,
        error: errorRegions,
        isError: isErrorRegions
    } = useGetRegionsQuery();

    const [selectedRegionCode, setSelectedRegionCode] = useState(''); // '' pour "Toutes les régions"

    // Log pour débogage
    useEffect(() => {
        console.log("DashboardPage: selectedRegionCode mis à jour à:", selectedRegionCode);
    }, [selectedRegionCode]);


    // Calculer les statistiques à afficher (globales ou pour la région sélectionnée)
    const currentStats = useMemo(() => {
        if (selectedRegionCode && Array.isArray(regionStatsData)) {
            const foundRegionStats = regionStatsData.find(r => r.code_dr === selectedRegionCode);
            if (foundRegionStats) {
                console.log("DashboardPage: Utilisation des stats pour la région:", foundRegionStats.nom_region);
                // Adapter la structure pour correspondre à ce que StatCard attend
                return {
                    menages_collectes: {
                        total: foundRegionStats.menages_collectes_total || foundRegionStats.menages_collectes || 0, // Fallback si les noms diffèrent
                        rural: foundRegionStats.rural_collectes || 0,
                        urbain: foundRegionStats.urbain_collectes || 0,
                    },
                    menages_attendus: {
                        total: foundRegionStats.menages_attendus_total || foundRegionStats.menages_attendus || 0,
                        rural: foundRegionStats.rural_attendus || 0,
                        urbain: foundRegionStats.urbain_attendus || 0,
                    },
                    taux_de_couverture: {
                        global: foundRegionStats.taux_de_couverture || 0,
                    },
                    repartition_statuts: foundRegionStats.repartition_statuts || [],
                    nom_region: foundRegionStats.nom_region,
                    isRegional: true,
                };
            }
        }
        console.log("DashboardPage: Utilisation des stats globales.");
        return { ...globalStats, isRegional: false }; // Fallback sur les stats globales
    }, [selectedRegionCode, globalStats, regionStatsData]);


    // Gestion combinée du chargement et des erreurs
    const isInitialLoading = isLoadingGlobal || isLoadingRegionStats || isLoadingRegions;
    const hasCriticalError = (isErrorGlobal && !globalStats) || (isErrorRegionStats && !regionStatsData);

    if (isInitialLoading && (!globalStats || !regionStatsData || !regionsList)) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (hasCriticalError) {
        let errorMessages = [];
        if (isErrorGlobal && errorGlobal) errorMessages.push(`Stats globales: ${errorGlobal.status} ${JSON.stringify(errorGlobal.data)}`);
        if (isErrorRegionStats && errorRegionStats) errorMessages.push(`Stats régionales: ${errorRegionStats.status} ${JSON.stringify(errorRegionStats.data)}`);
        return <Alert severity="error">Erreur critique de chargement des données: {errorMessages.join('; ')}</Alert>;
    }

    // Données pour les StatCards, provenant de currentStats
    const collected = currentStats?.menages_collectes || { rural: 0, urbain: 0, total: 0 };
    const expected = currentStats?.menages_attendus || { rural: 0, urbain: 0, total: 0 };
    const coverage = currentStats?.taux_de_couverture?.global || 0;
    const statuses = currentStats?.repartition_statuts || [];

    const complets = statuses.find(s => s.statut_nom?.toLowerCase().includes('complet'))?.count || 0;
    const partiels = statuses.find(s => s.statut_nom?.toLowerCase().includes('partiel'))?.count || 0;
    const refus = statuses.find(s => s.statut_nom?.toLowerCase().includes('refus'))?.count || 0;
    // Pour le PieChart, on peut vouloir afficher tous les statuts avec un compte > 0
    const statusesForChart = statuses.filter(s => s.count > 0).map(s => ({ name: s.statut_nom, value: s.count }));


    // Dédoublonnage des régions pour la barre de progression (basé sur regionStatsData global)
    const uniqueRegionStatsForProgress = [];
    const seenRegionNames = new Set();
    if (Array.isArray(regionStatsData)) {
        regionStatsData.forEach(region => {
            if (!seenRegionNames.has(region.nom_region)) {
                uniqueRegionStatsForProgress.push(region);
                seenRegionNames.add(region.nom_region);
            }
        });
    }
    
    const pageTitle = currentStats?.isRegional
        ? `Suivi des Enquêtes - Région de ${currentStats.nom_region}`
        : "Plateforme de Suivi des Enquêtes (National)";

    return (
        <Box sx={{pb: 4, px: { xs: 1, sm: 2, md: 3 } }}   >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }} >
                {currentStats?.isRegional ? (
                     <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: "text.primary" }}>
                        {currentStats.nom_region}
                    </Typography>
                ) : (
                    <PublicIcon color="primary" sx={{fontSize: '2.2rem'}}/>
                )}
                 <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {currentStats?.isRegional ? " - Vue Détaillée" : "Suivi National des Enquêtes"}
                </Typography>
            </Stack>


            <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} lg={3} >
                    <StatCard title="Ménages collectés" totalValue={collected.total} ruralValue={collected.rural} urbainValue={collected.urbain} isDetailedCountCard={true} icon={<GroupIcon />} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard title="Ménages attendus" totalValue={expected.total} ruralValue={expected.rural} urbainValue={expected.urbain} isDetailedCountCard={true} icon={<GroupIcon color="action" sx={{opacity: 0.6}} />} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard title="Taux de couverture" mainValue={`${coverage.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`} icon={<BarChartIcon />} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard title="Statuts" completValue={complets} partielValue={partiels} refusValue={refus} isStatusCard={true} icon={<PlaylistAddCheckIcon />} />
                </Grid>
            </Grid>

            {/* <Grid container spacing={2.5} sx={{ mt: 1.5 }}> */}
                {/* <Grid item xs={12} lg={7}> Section Progression des Régions (toujours globale) */}
                    <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: 2, height: '100%',mt: 1.5 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 1.5 }}>
                            Progression (Toutes les Régions)
                        </Typography>
                        {isLoadingRegionStats && !regionStatsData ? <Box sx={{textAlign: 'center'}}><CircularProgress size={24} /></Box> :
                         uniqueRegionStatsForProgress.length > 0 ? (
                            uniqueRegionStatsForProgress.map(region => (
                                <RegionProgress
                                    key={region.code_dr + (region.nom_region || Math.random())} // Clé plus robuste
                                    regionName={region.nom_region}
                                    progressValue={region.menages_collectes > 0 ? (region.menages_collectes/ region.menages_attendus) * 100 : 0}
                                    collected={region.menages_collectes}
                                    expected={region.menages_attendus}
                                />
                            ))
                        ) : (
                            <Typography color="text.secondary" sx={{textAlign: 'center', py: 2}}>Aucune donnée de progression régionale.</Typography>
                        )}
                    </Paper>
                {/* </Grid> */}
                <Grid item xs={12} lg={5} sx={{ mt: 1.5 }}> {/* Section PieChart (reflète la sélection) */}
                    { (isLoadingGlobal && !selectedRegionCode) || (isLoadingRegionStats && selectedRegionCode) ?
                        <Box sx={{textAlign: 'center', height: '100%', display: 'flex', alignItems:'center', justifyContent: 'center'}}><CircularProgress size={24} /></Box> :
                        (statusesForChart.length > 0 ?
                            <StatusPieChart
                                data={statusesForChart}
                                title={`Répartition des Statuts ${currentStats?.isRegional ? `(${currentStats.nom_region})` : '(National)'}`}
                            /> :
                            <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography color="text.secondary">Aucune donnée de statut à visualiser.</Typography>
                            </Paper>
                        )
                    }
                </Grid>
            {/* </Grid> */}

            <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
                    Liste des Ménages {selectedRegionCode && regionsList?.find(r => r.code_dr === selectedRegionCode) ? `pour ${regionsList.find(r => r.code_dr === selectedRegionCode).nom_region}` : "(Toutes les Régions)"}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                    <Button
                        variant={selectedRegionCode === '' ? 'contained' : 'outlined'}
                        onClick={() => {
                            console.log("DashboardPage: Clic sur 'Toutes les régions'");
                            setSelectedRegionCode('');
                        }}
                        size="medium"
                        disabled={isLoadingRegions && !regionsList}
                    >
                        Toutes les régions
                    </Button>
                    {isLoadingRegions && !regionsList && <CircularProgress size={20} sx={{ml:1}}/>}
                    {regionsList && Array.isArray(regionsList) && regionsList.map(region => (
                        <Button
                            key={region.code_dr}
                            variant={selectedRegionCode === region.code_dr ? 'contained' : 'outlined'}
                            color="primary"
                            onClick={() => {
                                const newRegionCode = region.code_dr;
                                console.log(`DashboardPage: Clic sur région - Code: ${newRegionCode}, Nom: ${region.nom_region}`);
                                setSelectedRegionCode(newRegionCode);
                            }}
                            size="medium"
                        >
                            {region.nom_region}
                        </Button>
                    ))}
                    {!isLoadingRegions && Array.isArray(regionsList) && regionsList.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ml:1}}>Aucune région disponible pour le filtrage.</Typography>
                    )}
                </Stack>
                {/* MenagesTable ne change pas, il reçoit selectedRegionCode et gère son propre filtre de statut */}
                <MenagesTable
                    selectedRegionCode={selectedRegionCode}
                />
            </Paper>
        </Box>
    );
};

export default DashboardPage;