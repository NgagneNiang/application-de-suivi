// src/components/dashboard/MenagesTable.jsx

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Alert, FormControl,
    InputLabel, Select, MenuItem, Grid, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { useGetMenagesQuery } from '../api/apiSlice';

// const getStatutChipColor = (statut) => {
//     const statutLower = statut?.toLowerCase() || '';
//     if (statutLower.includes('complet')) return 'success';
//     if (statutLower.includes('partiel')) return 'warning';
//     if (statutLower.includes('refus')) return 'error';
//     return 'default';
// };

const getStatutChipColor = (statut) => {
    const statutLower = statut?.toLowerCase() || '';
    if (statutLower.includes('complet')) return 'success';
    if (statutLower.includes('partiel')) return 'warning';
    if (statutLower.includes('refus')) return 'error';
    return 'default';
};

const MenagesTable = ({ selectedRegionCode }) => {
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [statutFilter, setStatutFilter] = useState(''); // État local pour le filtre de statut

    // Construction des queryParams
    const queryParams = {
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        ...(selectedRegionCode && { region__code_dr: selectedRegionCode }),
        ...(statutFilter && { statut_menage: statutFilter }),
    };

    const {
        data: menagesDataResponse,
        isLoading,
        isFetching,
        error,
        isError,
    } = useGetMenagesQuery(queryParams, {
        refetchOnMountOrArgChange: true, // Important pour que la requête soit refaite quand queryParams change
    });

    // Log pour déboguer les props, états, et queryParams
    useEffect(() => {
        console.log("MenagesTable: === RENDER/UPDATE MenagesTable ===");
        console.log("  Prop selectedRegionCode:", selectedRegionCode);
        console.log("  État statutFilter:", statutFilter);
        console.log("  État paginationModel:", paginationModel);
        console.log("  => QueryParams construits:", JSON.stringify(queryParams));
        console.log("  RTK Query - isFetching:", isFetching, "isLoading:", isLoading);
        if (isError) {
            console.error("  RTK Query - Erreur:", error);
        }
        if (menagesDataResponse) {
             console.log("  RTK Query - Réponse (count):", menagesDataResponse.count, "Résultats:", menagesDataResponse.results?.length);
        }
        console.log("MenagesTable: ================================");
    }, [selectedRegionCode, statutFilter, paginationModel, queryParams, menagesDataResponse, isFetching, isLoading, error]); // Ajout de `error`

    const handleStatutFilterChange = (event) => {
        const newStatut = event.target.value;
        console.log(`MenagesTable: handleStatutFilterChange - sélection de statut: '${newStatut}'`);
        setStatutFilter(newStatut);
        // Réinitialiser la pagination à la première page lors d'un changement de filtre
        setPaginationModel(prev => ({ ...prev, page: 0 }));
    };

    const columns = [
        { field: 'idmng', headerName: 'ID', width: 180, sortable: false },
        { field: 'region_nom', headerName: 'Région', width: 150, sortable: true },
        {
            field: 'statut_menage_display',
            headerName: 'Statut',
            width: 120,
            sortable: true,
            renderCell: (params) => {
                if (params.value == null) return 'N/A';
                return (
                    <Chip
                        label={String(params.value)}
                        color={getStatutChipColor(String(params.value))}
                        size="small"
                        variant="outlined"
                    />
                );
            },
        },
        { field: 'nom_cm', headerName: 'Chef de Ménage', width: 200, sortable: true },
        {
            field: 'date_enquete',
            headerName: 'Date Enquête',
            width: 130,
            type: 'date',
            sortable: true,
            valueGetter: (params) => {
                if (!params || params.row == null) return null;
                const rawDateValue = params.row.date_enquete;
                if (rawDateValue) {
                    const dateObj = new Date(rawDateValue);
                    return isNaN(dateObj.getTime()) ? null : dateObj;
                }
                return null;
            },
            renderCell: (params) => {
                if (params.value instanceof Date && !isNaN(params.value.getTime())) {
                    return params.value.toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                    });
                }
                return 'N/A';
            }
        },
    ];

    const validRows = (menagesDataResponse?.results || []).filter(row => row && typeof row === 'object');
    const rowCount = menagesDataResponse?.count || 0;

    // Afficher le loader principal si isLoading (premier chargement) ET pas encore de données
    if (isLoading && !menagesDataResponse) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
    }

    return (
        <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                 <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small" variant="outlined">
                        <InputLabel id="statut-table-filter-label">Filtrer par Statut</InputLabel>
                        <Select
                            labelId="statut-table-filter-label"
                            name="statut_menage_filter" // Nom unique pour le champ
                            value={statutFilter}
                            label="Filtrer par Statut"
                            onChange={handleStatutFilterChange}
                        >
                            <MenuItem value=""><em>Tous les statuts</em></MenuItem>
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

            {isError && error && ( // Afficher l'alerte d'erreur seulement si isError est vrai ET error existe
                 <Alert severity="error" sx={{mb:2}}>
                    Erreur lors du chargement des ménages. Détails: {error.data?.detail || error.status || 'Erreur inconnue'}
                </Alert>
            )}

            <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={validRows}
                    columns={columns}
                    getRowId={(row) => {
                        if (row && row.idmng != null) {
                            return row.idmng;
                        }
                        console.warn("MenagesTable: Ligne sans idmng ou idmng null/undefined:", row);
                        return `fallback-${Math.random()}-${validRows.indexOf(row)}`;
                    }}
                    loading={isFetching} // Utiliser isFetching pour le spinner pendant les re-fetchs
                    paginationMode="server"
                    rowCount={rowCount}
                    pageSizeOptions={[5, 10, 25, 50]}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}
                    disableRowSelectionOnClick
                    autoHeight={false} // Garder une hauteur fixe pour éviter les sauts de page
                />
            </Box>
        </>
    );
};

export default MenagesTable;