import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Lobby from './pages/Lobby.jsx';
import Room from './pages/Room.jsx';

const Root = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>        
        <Route index element={<Navigate to="/lobby" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/room/:id" element={<Room />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById('root')).render(<Root />);
