import React, { useState } from 'react';
import { Box, Drawer, AppBar, Toolbar, IconButton, Typography, CssBaseline } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // À créer
import Header from './Header';   // À créer

const drawerWidth = 240;

const MainLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <Header drawerWidth={drawerWidth} handleDrawerToggle={handleDrawerToggle} /> {/* Header personnalisé */}
            <Sidebar
                drawerWidth={drawerWidth}
                mobileOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
            />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: '64px', // Hauteur de l'AppBar
                    backgroundColor: (theme) => theme.palette.background.default,
                    minHeight: 'calc(100vh - 64px)'
                }}
            >
                <Outlet /> {/* C'est ici que les pages s'afficheront */}
            </Box>
        </Box>
    );
};

export default MainLayout;