import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuth } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Informe email e senha'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.token, data.user);
      navigate('/lobby');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciais inválidas');
    } finally { setLoading(false); }
  }

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-inner">
          <div className="card-header">
            <div>
              <h2 className="title">Entrar</h2>
              <div className="subtitle">Bem-vindo de volta ao ChatOnline</div>
            </div>
          </div>

          <form className="form" onSubmit={submit}>
            <div className="row">
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="row">
              <label className="label">Senha</label>
              <div style={{display:'flex', gap:8}}>
                <input type={showPw ? 'text' : 'password'} className="input" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="btn btn-ghost" onClick={()=>setShowPw(v=>!v)}>{showPw? 'Ocultar':'Mostrar'}</button>
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="actions">
              <button disabled={loading} className="btn btn-primary" type="submit">{loading? 'Entrando...':'Entrar'}</button>
              <Link className="btn btn-ghost" to="/register">Criar conta</Link>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-inner">
          <h3 className="title" style={{fontSize:18, marginBottom:8}}>Dica</h3>
          <div className="note">Se ainda não tem uma conta, clique em "Criar conta" e registre-se em segundos.</div>
        </div>
      </div>
    </div>
  );
}
