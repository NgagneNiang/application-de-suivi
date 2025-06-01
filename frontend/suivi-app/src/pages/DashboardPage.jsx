import React from 'react';
import { Box, Grid, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import StatCard from '../dashboard/StatCard';
// import RegionProgress from '../components/dashboard/RegionProgress';
// import MenagesTable from '../components/dashboard/MenagesTable'; // À créer
import { useGetGlobalStatsQuery, useGetRegionStatsQuery } from '../api/apiSlice';
import MenagesTable from '../dashboard/MenagesTable';
import RegionProgress from '../dashboard/RegionProgress';

const DashboardPage = () => {
    const { data: globalStats, isLoading: isLoadingGlobal, error: errorGlobal } = useGetGlobalStatsQuery();
    const { data: regionStats, isLoading: isLoadingRegions, error: errorRegions } = useGetRegionStatsQuery();

    if (isLoadingGlobal || isLoadingRegions) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }

    if (errorGlobal || errorRegions) {
        return <Alert severity="error">Erreur lors du chargement des données du tableau de bord.</Alert>;
    }
    
    // Vérifier que les données existent avant de les utiliser
    const collected = globalStats?.menages_collectes || { rural: 0, urbain: 0, total: 0 };
    const expected = globalStats?.menages_attendus || { rural: 0, urbain: 0, total: 0 };
    const coverage = globalStats?.taux_de_couverture?.global || 0;
    const statuses = globalStats?.repartition_statuts || [];

    const complets = statuses.find(s => s.statut_nom === 'COMPLET')?.count || 0;
    const partiels = statuses.find(s => s.statut_nom === 'PARTIEL')?.count || 0;
    const refus = statuses.find(s => s.statut_nom === 'Refus')?.count || 0; // Attention à la casse de "Refus" dans le backend


    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Plateforme de Suivi des Enquêtes
            </Typography>

            <Grid container spacing={3}>
                {/* Cartes de statistiques */}
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Ménages collectés"
                        totalValue={collected.total}
                        ruralValue={collected.rural}
                        urbainValue={collected.urbain}
                    />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Ménages attendus"
                        totalValue={expected.total}
                        ruralValue={expected.rural}
                        urbainValue={expected.urbain}
                    />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard title="Taux de couverture" mainValue={`${coverage}%`} />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Statuts"
                        completValue={complets}
                        partielValue={partiels}
                        refusValue={refus}
                        isStatusCard={true}
                    />
                </Grid>

                {/* Progression par région */}
                <Grid item xs={12}> 
                    <Paper sx={{ p: 6, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>Progression par région</Typography>
                        {regionStats && regionStats.map(region => (
                            <RegionProgress
                                key={region.code_dr}
                                regionName={region.nom_region}
                                progressValue={region.menages_collectes > 0 ? (region.menages_attendus / region.menages_collectes) * 100 : 0}
                            />
                        ))}
                    </Paper>
                </Grid>

                {/* Liste des ménages */}
                <Grid item xs={12}>
                     <MenagesTable />
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;