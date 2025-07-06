import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="enqueteurs" element={<DashboardPage />} /> 
                    <Route path="superviseurs" element={<DashboardPage />} />
                    <Route path="menages" element={<DashboardPage />} />
                    <Route path="statistiques" element={<DashboardPage />} />
                    <Route path="parametres" element={<DashboardPage/>} />
                   
                </Route>
            </Routes>
        </Router>
    );
}

export default App;