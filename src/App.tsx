// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home';
import TransactionsPage from './pages/Transactions';
import RegisterForm from './components/Auth/RegisterForm';
import LoginForm from './components/Auth/LoginForm';
// SOLO esta importación; ya no declares PrivateRoute en este archivo
import { PrivateRoute } from './components/Auth/PrivateRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública: página de inicio */}
        <Route path="/" element={<HomePage />} />

        {/* Ruta de login */}
        <Route path="/login" element={<LoginForm />} />

        {/* Ruta de registro */}
        <Route path="/register" element={<RegisterForm />} />

        {/* Ruta privada */}
        <Route
          path="/transactions"
          element={
            <PrivateRoute>
              <TransactionsPage />
            </PrivateRoute>
          }
        />

        {/* Cualquier otra URL redirige al home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
