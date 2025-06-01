import { useGetMenagesQuery, useGetRegionsQuery } from '../api/apiSlice';
import React, { useState, useEffect, useMemo } from 'react';
import {
    Paper, Box, Typography, CircularProgress, Alert, FormControl,
    InputLabel, Select, MenuItem, Grid, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';

const getStatutChipColor = (statut) => {
    const statutLower = statut?.toLowerCase() || '';
    if (statutLower.includes('complet')) return 'success';
    if (statutLower.includes('partiel')) return 'warning';
    if (statutLower.includes('refus')) return 'error';
    // Ajoutez d'autres statuts si nécessaire, ex:
    // if (statutLower.includes('affecté')) return 'info';
    // if (statutLower.includes('non affecté')) return 'secondary';
    return 'default';
};

const MenagesTable = () => {
    const [filters, setFilters] = useState({
        region__code_dr: '',
        statut_menage: '',
    });

    const [paginationModel, setPaginationModel] = useState({
        page: 0,        // L'index de page pour DataGrid commence à 0
        pageSize: 10,
    });

    // Utiliser useMemo pour que queryParams ne soit recréé que si filters ou paginationModel change
    const queryParams = useMemo(() => {
        const params = {
            page: paginationModel.page + 1, // L'API Django attend une page commençant à 1
            page_size: paginationModel.pageSize,
        };
        if (filters.region__code_dr) {
            params.region__code_dr = filters.region__code_dr;
        }
        if (filters.statut_menage) {
            params.statut_menage = filters.statut_menage;
        }
        return params;
    }, [filters, paginationModel]);

    const {
        data: menagesDataResponse, // Réponse complète de l'API pour les ménages
        isLoading: isLoadingMenages,
        isFetching: isFetchingMenages,
        error: errorMenages,
        isError: isErrorMenages,
        isSuccess: isSuccessMenages,
    } = useGetMenagesQuery(queryParams, {
        // Optionnel: refetchOnMountOrArgChange: true, // Comportement par défaut
        // Optionnel: pollingInterval: 30000, // Pour rafraîchir les données toutes les 30s
    });

    // Hook pour récupérer les régions pour le filtre
    const { data: regionsResponse, isLoading: isLoadingRegions, error: errorRegions } = useGetRegionsQuery();

    // Logs pour le débogage (peut être retiré ou conditionné en production)
    useEffect(() => {
        // console.groupCollapsed("MenagesTable Debug");
        // console.log("Filtres UI:", filters);
        // console.log("Modèle Pagination DataGrid:", paginationModel);
        // console.log("Paramètres API Ménages (queryParams):", queryParams);
        // console.log("Réponse API Ménages (menagesDataResponse):", menagesDataResponse);
        // console.log("Ménages: isLoading:", isLoadingMenages, "isFetching:", isFetchingMenages, "isSuccess:", isSuccessMenages, "isError:", isErrorMenages, "error:", errorMenages);
        // console.log("Réponse API Régions (regionsResponse):", regionsResponse);
        // console.log("Régions: isLoading:", isLoadingRegions, "error:", errorRegions);
        // if (isSuccessMenages && menagesDataResponse?.results?.length > 0) {
        //     console.log("Premier ménage:", menagesDataResponse.results[0]);
        // }
        // if (regionsResponse?.results?.length > 0) {
        //     console.log("Première région:", regionsResponse.results[0]);
        // }
        // console.groupEnd();
    }, [
        filters, paginationModel, queryParams,
        menagesDataResponse, isLoadingMenages, isFetchingMenages, isSuccessMenages, isErrorMenages, errorMenages,
        regionsResponse, isLoadingRegions, errorRegions
    ]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPaginationModel(prev => ({ ...prev, page: 0 })); // Réinitialiser à la page 0 lors d'un changement de filtre
    };

    const columns = useMemo(() => [ // Mémoriser les colonnes pour éviter les re-créations inutiles
        {
            field: 'idmng',
            headerName: 'ID Ménage', // Titre plus explicite
            width: 190, // Un peu plus de largeur si les IDs sont longs
            sortable: false,
            // Optionnel: pour un meilleur style si le contenu peut déborder
            // cellClassName: 'truncate-cell', // Ajoutez une classe CSS pour gérer le débordement
        },
        {
            field: 'region_nom',
            headerName: 'Région',
            width: 150,
            sortable: false
        },
        {
            field: 'statut_menage_display',
            headerName: 'Statut',
            width: 130, // Un peu plus de marge pour le Chip
            sortable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value || 'N/D'} // "Non Défini" ou "Non Disponible"
                    color={getStatutChipColor(params.value)}
                    size="small"
                    variant="outlined"
                    sx={{ width: '100%', justifyContent: 'flex-start' }} // Assure que le label n'est pas coupé
                />
            ),
        },
        {
            field: 'nom_cm',
            headerName: 'Chef de Ménage',
            width: 220, // Plus de largeur pour les noms longs
            sortable: false
        },
        {
            field: 'date_enquete',
            headerName: 'Date Enquête',
            width: 130,
            type: 'date',
            sortable: false,
            valueGetter: (params) => {
                // Sécurisation robuste pour la conversion de date
                if (params && typeof params.value === 'string' && params.value.trim() !== '') {
                    const date = new Date(params.value);
                    return !isNaN(date.getTime()) ? date : null;
                }
                if (params && params.value instanceof Date && !isNaN(params.value.getTime())) {
                    return params.value;
                }
                return null;
            },
            renderCell: (params) => {
                if (params.value && params.value instanceof Date && !isNaN(params.value.getTime())) {
                    return params.value.toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                    });
                }
                return 'N/D';
            }
        },
    ], []); // Le tableau de colonnes ne change pas, donc mémorisation vide

    // Gestion de l'état de chargement initial des ménages
    if (isLoadingMenages && !menagesDataResponse) {
        return (
            <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', boxShadow: 3 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>Chargement des données des ménages...</Typography>
            </Paper>
        );
    }

    // Gestion des erreurs de chargement des ménages
    if (isErrorMenages) {
        console.error("Erreur API MenagesTable (Ménages):", errorMenages);
        return (
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
                <Alert severity="error" sx={{ '& .MuiAlert-message': { flexGrow: 1 } }}>
                    <Typography fontWeight="bold">Erreur de chargement des ménages</Typography>
                    {errorMenages?.status && <Typography variant="body2">Status: {errorMenages.status}</Typography>}
                    {errorMenages?.data?.detail && <Typography variant="body2">Détail: {errorMenages.data.detail}</Typography>}
                    {(!errorMenages?.status && !errorMenages?.data?.detail && typeof errorMenages?.message === 'string') && <Typography variant="body2">{errorMenages.message}</Typography>}
                    {(!errorMenages?.status && !errorMenages?.data?.detail && !errorMenages?.message) && <Typography variant="body2">Une erreur inconnue est survenue.</Typography>}
                </Alert>
            </Paper>
        );
    }

    // Préparer les données pour la DataGrid
    const rowsToShow = (isSuccessMenages && Array.isArray(menagesDataResponse?.results)) ? menagesDataResponse.results : [];
    const totalRowCount = (isSuccessMenages && typeof menagesDataResponse?.count === 'number') ? menagesDataResponse.count : 0;

    return (
        <Paper sx={{ p: {xs: 1.5, sm: 2, md: 2.5} , borderRadius: "12px", boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2.5, color: 'text.primary' }}>
                Liste des ménages
            </Typography>

            {/* Filtres */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <FormControl fullWidth size="small" variant="outlined">
                        <InputLabel id="region-filter-label">Région</InputLabel>
                        <Select
                            labelId="region-filter-label"
                            name="region__code_dr"
                            value={filters.region__code_dr}
                            label="Région"
                            onChange={handleFilterChange}
                            disabled={isLoadingRegions}
                        >
                            <MenuItem value="">
                                <em>Toutes les régions</em>
                            </MenuItem>
                            {isLoadingRegions ? (
                                <MenuItem disabled>Chargement...</MenuItem>
                            ) : (
                                Array.isArray(regionsResponse?.results) && regionsResponse.results.map(region => (
                                    <MenuItem key={region.code_dr} value={region.code_dr}>{region.nom_region}</MenuItem>
                                ))
                            )}
                            {errorRegions && <MenuItem disabled sx={{color: 'error.main'}}>Erreur chargement régions</MenuItem>}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <FormControl fullWidth size="small" variant="outlined">
                        <InputLabel id="statut-filter-label">Statut</InputLabel>
                        <Select
                            labelId="statut-filter-label"
                            name="statut_menage"
                            value={filters.statut_menage}
                            label="Statut"
                            onChange={handleFilterChange}
                        >
                            <MenuItem value="">
                                <em>Tous les statuts</em>
                            </MenuItem>
                            <MenuItem value={4}>Complet</MenuItem>
                            <MenuItem value={3}>Partiel</MenuItem>
                            <MenuItem value={9}>Refus</MenuItem>
                            <MenuItem value={1}>Non Affecté</MenuItem>
                            <MenuItem value={2}>Affecté</MenuItem>
                            <MenuItem value={7}>N'existe plus</MenuItem>
                            <MenuItem value={8}>Déménagé</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Tableau DataGrid */}
            <Box sx={{ height: 520, width: '100%' }}> {/* Hauteur légèrement augmentée */}
                <DataGrid
                    rows={rowsToShow}
                    columns={columns}
                    getRowId={(row) => row.idmng}
                    loading={isFetchingMenages}

                    paginationMode="server"
                    rowCount={totalRowCount}

                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[5, 10, 25, 50, 100]} // Ajout de 100

                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                        border: '1px solid',
                        borderColor: 'divider', // Utilise la couleur de diviseur du thème
                        borderRadius: '8px', // Coins arrondis pour la grille elle-même
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: (theme) => theme.palette.mode === 'light' ? 'grey[100]' : 'grey[800]', // Fond pour les en-têtes
                            fontWeight: 'bold',
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid', // Lignes de séparation plus subtiles
                            borderColor: 'divider',
                        },
                        '& .MuiDataGrid-cell:hover': {
                            color: 'primary.main',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            borderTop: '1px solid',
                            borderColor: 'divider',
                        },
                        // S'assurer que l'overlay "Pas de résultats" est bien visible
                        '& .MuiDataGrid-overlayWrapper': totalRowCount === 0 && !isFetchingMenages ? {} : { minHeight: 'auto'},
                    }}
                    disableRowSelectionOnClick
                    // autoHeight // Décommentez si vous préférez que la grille s'ajuste à son contenu
                />
            </Box>
        </Paper>
    );
};

export default MenagesTable;