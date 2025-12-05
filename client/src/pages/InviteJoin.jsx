import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function InviteJoin() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post(`/invites/${token}`);
        if (cancelled) return;
        const roomId = data.room?.id;
        if (!roomId) {
          setStatus('error');
          setMessage('Convite inválido.');
          return;
        }
        navigate(`/room/${roomId}`, { replace: true });
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setMessage(e.response?.data?.error || 'Não foi possível usar este convite.');
      }
    })();
    return () => { cancelled = true; };
  }, [token, navigate]);

  if (status === 'loading') {
    return (
      <div className="card">
        <div className="card-inner">
          <h2 className="title">Entrando na sala...</h2>
          <div className="note">Estamos validando o convite e te colocando na sala.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-inner">
        <h2 className="title">Convite inválido</h2>
        <div className="error" style={{marginBottom:12}}>{message}</div>
        <Link className="btn btn-primary" to="/lobby">Voltar para o lobby</Link>
      </div>
    </div>
  );
}

