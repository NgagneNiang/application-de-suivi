import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
// Importer les autres pages quand elles seront créées
// import EnqueteursPage from './pages/EnqueteursPage';
// import SuperviseursPage from './pages/SuperviseursPage';
// import MenagesPage from './pages/MenagesPage';
// import StatistiquesPage from './pages/StatistiquesPage';
// import ParametresPage from './pages/ParametresPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<DashboardPage />} />
                    {/* <Route path="enqueteurs" element={<EnqueteursPage />} /> */}
                    {/* <Route path="superviseurs" element={<SuperviseursPage />} /> */}
                    {/* <Route path="menages" element={<MenagesPage />} /> */}
                    {/* <Route path="statistiques" element={<StatistiquesPage />} /> */}
                    {/* <Route path="parametres" element={<ParametresPage />} /> */}
                    {/* Ajouter une route 404 si besoin */}
                </Route>
            </Routes>
        </Router>
    );
}

export default App;