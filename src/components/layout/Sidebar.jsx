import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import { NavLink } from 'react-router-dom';
// import AnsdLogo from '../../assets/ansd_logo.png'; // Assurez-vous d'avoir le logo

const menuItems = [
    { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/' },
    { text: 'Enquêteurs', icon: <PeopleIcon />, path: '/enqueteurs' },
    { text: 'Superviseurs', icon: <SupervisedUserCircleIcon />, path: '/superviseurs' },
    { text: 'Ménages', icon: <HomeWorkIcon />, path: '/menages' },
    { text: 'Statistiques', icon: <BarChartIcon />, path: '/statistiques' },
    { text: 'Paramètres', icon: <SettingsIcon />, path: '/parametres' },
];

const Sidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle }) => {
    const drawerContent = (
        <div>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'center' }}>
                {/* <img src={AnsdLogo} alt="ANSD Logo" style={{ height: 40, marginRight: 8 }} /> */}
                <Typography variant="h5" noWrap component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
                    ANSD
                </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            component={NavLink}
                            to={item.path}
                            onClick={mobileOpen ? handleDrawerToggle : null} // Ferme le drawer sur mobile au clic
                            sx={{
                                color: 'rgba(255,255,255,0.8)',
                                '&.active': {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    borderLeft: '3px solid white',
                                    '& .MuiListItemIcon-root': {
                                       color: 'white',
                                    }
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                },
                                paddingLeft: '24px'
                            }}
                        >
                            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label="mailbox folders"
        >
            {/* Drawer pour mobile */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: 'primary.main' },
                }}
            >
                {drawerContent}
            </Drawer>
            {/* Drawer pour desktop */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: 'primary.main' },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};

export default Sidebar;