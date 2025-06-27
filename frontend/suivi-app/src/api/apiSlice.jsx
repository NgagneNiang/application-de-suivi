// // src/api/apiSlice.js
// import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000/api/';

// export const apiSlice = createApi({
//     reducerPath: 'api',
//     baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
//     tagTypes: ['Menages', 'GlobalStats', 'RegionStats', 'Enqueteurs', 'Regions', 'Superviseurs'], // Ajout de Superviseurs par anticipation
//     endpoints: (builder) => ({
//         // ----- STATISTIQUES -----
//         getGlobalStats: builder.query({
//             query: () => 'stats/global/',
//             providesTags: ['GlobalStats'], // Corrigé : GlobalStats (et non GlobaalStats)
//         }),
//         getRegionStats: builder.query({
//             query: () => 'stats/regions/',
//             providesTags: ['RegionStats'],
//         }),

//         // ----- MENAGES -----
//         getMenages: builder.query({
//             query: (params) => {
//                 // Filtrer les paramètres vides pour ne pas envoyer ?param=&...
//                 const filteredParams = Object.entries(params)
//                     .filter(([key, value]) => value !== '' && value !== null && value !== undefined)
//                     .reduce((obj, [key, value]) => {
//                         obj[key] = value;
//                         return obj;
//                     }, {});
//                 return {
//                     url: 'menages/',
//                     params: filteredParams,
//                 };
//             },
//             // Si MenageViewSet renvoie bien une structure paginée {count, next, previous, results}
//             providesTags: (result, error, arg) =>
//                 result?.results
//                     ? [
//                         ...result.results.map(({ idmng }) => ({ type: 'Menages', id: idmng })),
//                         { type: 'Menages', id: 'LIST' },
//                       ]
//                     : [{ type: 'Menages', id: 'LIST' }],
//         }),
//         getMenageById: builder.query({
//             query: (idmng) => `menages/${idmng}/`,
//             providesTags: (result, error, idmng) => [{ type: 'Menages', id: idmng }],
//         }),
//         // TODO: addMenage, updateMenage, deleteMenage si nécessaire

//         // ----- REGIONS -----
//         getRegions: builder.query({
//             query: () => 'regions/', // Devrait maintenant renvoyer un tableau direct si pagination_class = None
//             // Si RegionViewSet renvoie un tableau direct (pagination_class = None):
//             providesTags: (result, error, arg) =>
//                 result
//                     ? [
//                         ...result.map(({ code_dr }) => ({ type: 'Regions', id: code_dr })),
//                         { type: 'Regions', id: 'LIST' },
//                       ]
//                     : [{ type: 'Regions', id: 'LIST' }],
//         }),

//          // ----- ENQUETEURS -----
//         getEnqueteurs: builder.query({
//             query: (params) => ({
//                  url: 'enqueteurs/', // Cet endpoint est paginé
//                  params: params,
//             }),
//             providesTags: (result, error, arg) =>
//                 result?.results
//                     ? [
//                         ...result.results.map(({ login_enq }) => ({ type: 'Enqueteurs', id: login_enq })),
//                         { type: 'Enqueteurs', id: 'LIST' },
//                       ]
//                     : [{ type: 'Enqueteurs', id: 'LIST' }],
//         }),
//         // TODO: Endpoint pour Superviseurs si nécessaire
//     }),
// });

// export const {
//     useGetGlobalStatsQuery,
//     useGetRegionStatsQuery,
//     useGetMenagesQuery,
//     useGetMenageByIdQuery,
//     useGetRegionsQuery,
//     useGetEnqueteursQuery,
//     // Exporter les autres hooks si vous ajoutez des mutations/queries
// } = apiSlice;
// src/api/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000/api/';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
    tagTypes: ['Menages', 'GlobalStats', 'RegionStats', 'Enqueteurs', 'Regions', 'Superviseurs'],
    endpoints: (builder) => ({
        getGlobalStats: builder.query({
            query: () => 'stats/global/',
            providesTags: ['GlobalStats'],
        }),
        getRegionStats: builder.query({
            query: () => 'stats/regions/',
            providesTags: ['RegionStats'],
        }),
        getMenages: builder.query({
            query: (params) => {
                const filteredParams = Object.entries(params)
                    .filter(([key, value]) => value !== '' && value !== null && value !== undefined)
                    .reduce((obj, [key, value]) => {
                        obj[key] = value;
                        return obj;
                    }, {});
                // console.log("API SLICE - Params pour /menages/:", filteredParams); // Log ici
                console.log("API SLICE - Params FINALS pour /menages/:", JSON.stringify(filteredParams));
                return {
                    url: 'menages/',
                    params: filteredParams,
                };
            },
            providesTags: (result) => // Simplifié si on utilise des tags de liste ou ID
                result?.results
                    ? [
                        ...result.results.map(({ idmng }) => ({ type: 'Menages', id: idmng })),
                        { type: 'Menages', id: 'LIST' },
                      ]
                    : [{ type: 'Menages', id: 'LIST' }],
        }),
        getRegions: builder.query({
            query: () => 'regions/', // Renvoie un tableau direct car pagination_class = None
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ code_dr }) => ({ type: 'Regions', id: code_dr })),
                        { type: 'Regions', id: 'LIST' },
                      ]
                    : [{ type: 'Regions', id: 'LIST' }],
        }),
        getEnqueteurs: builder.query({
         // ... (inchangé)
            query: (params) => ({ url: 'enqueteurs/', params: params, }),
            providesTags: (result) => result?.results ? [ /* ... */ ] : [ /* ... */],
        }),
    }),
});

export const {
    useGetGlobalStatsQuery,
    useGetRegionStatsQuery,
    useGetMenagesQuery,
    // useGetMenageByIdQuery, // Vous ne l'utilisez pas encore
    useGetRegionsQuery,
    // useGetEnqueteursQuery, // Vous ne l'utilisez pas encore
} = apiSlice;