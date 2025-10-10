import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuth } from '../api';

function strengthScore(pw){
  let s = 0;
  if (!pw) return 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

export default function Register(){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const pwScore = useMemo(() => strengthScore(password), [password]);
  const pwPercent = (pwScore / 4) * 100;
  const meterClass = pwScore <= 1 ? '' : pwScore === 2 ? 'good' : 'strong';

  function validate(){
    if (name.trim().length < 2) return 'Nome precisa ter pelo menos 2 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
    if (password.length < 6) return 'Senha precisa ter pelo menos 6 caracteres';
    if (password !== confirm) return 'As senhas não conferem';
    return '';
  }

  async function submit(e){
    e.preventDefault();
    setError(''); setSuccess('');
    const v = validate();
    if (v){ setError(v); return; }
    setLoading(true);
    try{
      const { data } = await api.post('/auth/register', { name: name.trim(), email: email.trim(), password });
      setAuth(data.token, data.user);
      setSuccess('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/lobby'), 600);
    }catch(err){
      setError(err.response?.data?.error || 'Erro ao registrar');
    }finally{ setLoading(false); }
  }

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-inner">
          <div className="card-header">
            <div>
              <h2 className="title">Criar conta</h2>
              <div className="subtitle">Acesse salas, chat e vídeo em tempo real</div>
            </div>
          </div>

          <form className="form" onSubmit={submit}>
            <div className="row">
              <label className="label">Nome</label>
              <input className="input" placeholder="Seu nome" value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
            <div className="row">
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="voce@exemplo.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
            </div>
            <div className="row">
              <label className="label">Senha</label>
              <div style={{display:'grid', gap:8}}>
                <div style={{display:'flex', gap:8}}>
                  <input type={showPw? 'text':'password'} className="input" placeholder="Mínimo 6 caracteres" value={password} onChange={(e)=>setPassword(e.target.value)} />
                  <button type="button" className="btn btn-ghost" onClick={()=>setShowPw(v=>!v)}>{showPw? 'Ocultar':'Mostrar'}</button>
                </div>
                <div className={`password-meter ${meterClass}`}><span style={{width: pwPercent+"%"}}/></div>
                <div className="note">Use letras maiúsculas/minúsculas, números e símbolos</div>
              </div>
            </div>
            <div className="row">
              <label className="label">Confirmar senha</label>
              <input type={showPw? 'text':'password'} className="input" placeholder="Repita a senha" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <div className="actions">
              <button disabled={loading} className="btn btn-primary" type="submit">{loading? 'Criando...':'Criar conta'}</button>
              <Link className="btn btn-ghost" to="/login">Já tenho uma conta</Link>
            </div>
          </form>
        </div>
      </div>

      <div className="card" style={{alignSelf:'stretch'}}>
        <div className="card-inner">
          <h3 className="title" style={{fontSize:18, marginBottom:8}}>Recursos</h3>
          <ul className="note" style={{lineHeight:1.8}}>
            <li>Chat em tempo real com histórico</li>
            <li>Todo list colaborativo ao vivo</li>
            <li>Vídeo via WebRTC (STUN público)</li>
            <li>Autenticação JWT segura</li>
          </ul>
          <div className="subtitle" style={{marginTop:16}}>Ao criar conta, você concorda com nossos termos.</div>
        </div>
      </div>
    </div>
  );
}

