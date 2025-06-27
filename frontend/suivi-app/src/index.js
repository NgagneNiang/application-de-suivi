import React from 'react';
import ReactDOM from 'react-dom/client'; // Assurez-vous d'utiliser react-dom/client pour React 18+
import App from './App'; // ou './App.js'
import { Provider } from 'react-redux';
import { store } from './app/store';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './styles/theme';
import './index.css';
import 'animate.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);