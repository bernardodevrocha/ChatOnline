import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }
  return (
    <div className="container">
      <div className="nav">
        <div className="brand">
          <span className="brand-dot" /> ChatOnline
        </div>
        <div className="links">
          <Link className="link" to="/lobby">Lobby</Link>
          {!token && <Link className="link" to="/login">Login</Link>}
          {!token && <Link className="link" to="/register">Registrar</Link>}
          {token && <button className="btn btn-ghost" onClick={logout}>Sair</button>}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
