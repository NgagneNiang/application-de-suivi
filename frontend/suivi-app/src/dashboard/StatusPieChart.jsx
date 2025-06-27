// src/components/dashboard/StatusPieChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Typography, Paper, Box } from '@mui/material';

// Définissez des couleurs pour vos statuts
// Assurez-vous que les clés (en majuscules) correspondent aux 'name' que vous passerez dans les données
const STATUS_COLORS = {
    'COMPLET': '#4CAF50',       // Vert
    'PARTIEL': '#FFC107',     // Ambre/Orange
    'REFUS': '#F44336',         // Rouge
    'NON AFFECTE': '#9E9E9E',   // Gris
    'AFFECTÉ': '#2196F3', // Bleu (Notez l'accent ici si vos données l'ont)
    'AFFECTE': '#2196F3', // Bleu (sans accent si c'est le cas)
    "N'EXISTE PLUS": '#795548', // Marron
    "DÉMÉNAGÉ": '#607D8B',       // Bleu gris
    "DEMENAGE": '#607D8B',       // Bleu gris (sans accent)
    // Ajoutez d'autres statuts et couleurs si besoin
};

const StatusPieChart = ({ data }) => { // data attendu: [{ name: 'Complet', value: 100 }, ...]
    if (!data || data.length === 0) {
        return (
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Aucune donnée de statut à afficher.</Typography>
            </Paper>
        );
    }

    // Filtrer les données pour n'inclure que celles avec une valeur > 0 pour un affichage plus propre
    const filteredData = data.filter(entry => entry.value > 0);

    if (filteredData.length === 0) {
        return (
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Aucun ménage avec les statuts actuels.</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', textAlign: 'center', mb: 1 }}>
                Répartition des Statuts
            </Typography>
            <Box sx={{ width: '100%', height: 400 }}> {/* Hauteur fixe pour le conteneur du graphique */}
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={filteredData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            // label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} // Option pour afficher les labels sur les parts
                            outerRadius={120} // Ajustez selon la taille souhaitée
                            innerRadius={60} // Pour un effet Donut, mettez 0 pour un Pie plein
                            fill="#8884d8"  // Couleur par défaut si non trouvée dans STATUS_COLORS
                            dataKey="value"
                            nameKey="name"
                            paddingAngle={filteredData.length > 1 ? 1 : 0} // Petit espace entre les parts s'il y en a plusieurs
                        >
                            {filteredData.map((entry, index) => {
                                const entryNameUpper = entry.name?.toUpperCase() || 'INCONNU';
                                // Gérer les variations avec/sans accent pour la correspondance des couleurs
                                const colorKey = entryNameUpper.replace("É", "E").replace("È", "E");
                                return (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[colorKey] || '#82ca9d'} />
                                );
                            })}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value.toLocaleString('fr-FR'), name]} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default StatusPieChart;