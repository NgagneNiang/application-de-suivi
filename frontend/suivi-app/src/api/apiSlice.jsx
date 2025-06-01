import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'http://localhost:8000/api/'; // Votre URL backend

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
    tagTypes: ['Menages', 'GlobalStats', 'RegionStats', 'Enqueteurs', 'Regions'],
    endpoints: (builder) => ({
        // ----- STATISTIQUES -----
        getGlobalStats: builder.query({
            query: () => 'stats/global/',
            providesTags: ['GlobalStats'],
        }),
        getRegionStats: builder.query({
            query: () => 'stats/regions/',
            providesTags: ['RegionStats'],
        }),

        // ----- MENAGES -----
        getMenages: builder.query({
            query: (params) => ({ // params = { region__code_dr: '01', statut_menage: 4, page: 1, etc. }
                url: 'menages/',
                params: params,
            }),
            providesTags: (result, error, arg) =>
                result?.results // Supposant une pagination DRF
                    ? [...result.results.map(({ idmng }) => ({ type: 'Menages', id: idmng })), { type: 'Menages', id: 'LIST' }]
                    : [{ type: 'Menages', id: 'LIST' }],
        }),
        getMenageById: builder.query({
            query: (idmng) => `menages/${idmng}/`,
            providesTags: (result, error, idmng) => [{ type: 'Menages', id: idmng }],
        }),
        // addMenage, updateMenage, deleteMenage (si besoin de CRUD depuis le frontend)

        // ----- REGIONS -----
        getRegions: builder.query({
            query: () => 'regions/',
            providesTags: ['Regions']
        }),
         // ----- ENQUETEURS (si affichage liste) -----
        getEnqueteurs: builder.query({
            query: (params) => ({
                 url: 'enqueteurs/',
                 params: params, // ex: { superviseur_id: 'SP0101' }
            }),
            providesTags: ['Enqueteurs']
        }),
        // Idem pour Superviseurs si une page dédiée est prévue
    }),
});

export const {
    useGetGlobalStatsQuery,
    useGetRegionStatsQuery,
    useGetMenagesQuery,
    useGetMenageByIdQuery,
    useGetRegionsQuery,
    useGetEnqueteursQuery,
} = apiSlice;