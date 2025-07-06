import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1A3A5A', // Couleur principale de votre sidebar
        },
        secondary: {
            main: '#4A90E2', // Une autre couleur que vous utilisez
        },
        background: {
            default: '#F4F7FC', // Couleur de fond générale
            paper: '#FFFFFF',
        },
        text: {
            primary: '#333333',
            secondary: '#555555',
        }
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif', // Ou la police que vous préférez
        h5: {
            fontWeight: 600,
        },
        // ... autres customisations typographiques
    },
    components: {
         MuiCard: {
             styleOverrides: {
                 root: {
                     borderRadius: '12px',
                     boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
                 }
             }
         },
         // ... autres surcharges de composants
    }
    // ... autres options de thème
});

export default theme;