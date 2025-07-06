import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Select, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'; // Pour la flèche à côté de Dakar

// Vous devrez gérer l'état de la région sélectionnée (probablement via Redux ou contexte)
const Header = ({ drawerWidth, handleDrawerToggle }) => {
    const [selectedRegion, setSelectedRegion] = React.useState('Dakar'); // Exemple d'état local

    const handleRegionChange = (event) => {
        setSelectedRegion(event.target.value);
        // TODO: Mettre à jour l'état global ou appeler une action pour filtrer les données
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
                backgroundColor: 'background.paper',
                color: 'text.primary',
                boxShadow: '0px 1px 5px rgba(0,0,0,0.1)'
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
                    {/* Plateforme de Suivi des Enquêtes - Le titre est déjà dans la page */}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2, border: '1px solid #e0e0e0', borderRadius: 1, p:0.5 }}>
                    <Select
                        variant="standard"
                        disableUnderline
                        value={selectedRegion}
                        onChange={handleRegionChange}
                        sx={{ fontWeight: 'medium', fontSize: '0.9rem', '& .MuiSelect-select': { paddingRight: '24px !important' } }}
                    >
                        <MenuItem value="Dakar">Dakar</MenuItem>
                        <MenuItem value="Diourbel">Diourbel</MenuItem>
                        {/* Ajouter dynamiquement les autres régions depuis l'API */}
                    </Select>
                    <ArrowForwardIcon fontSize="small" sx={{ color: 'text.secondary' }}/>
                </Box>

                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    {/* Initiale de l'utilisateur ou icône */}
                    OP
                </Avatar>
            </Toolbar>
        </AppBar>
    );
};

export default Header;