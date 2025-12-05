import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getUser } from '../api';
import { getSocket } from '../socket';
import TodoList from '../components/TodoList';

export default function Lobby() {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  async function loadRooms() {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (e) {
      if (e.response?.status === 401) navigate('/login');
    }
  }

  useEffect(() => { loadRooms(); setSocket(getSocket()); }, []);

  useEffect(() => {
    if (!socket || !selectedRoom) return;
    socket.emit('joinRoom', { roomId: selectedRoom.id }, (res) => { if (res?.error) console.warn(res.error); });
  }, [socket, selectedRoom]);

  async function createRoom(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/rooms', { name, isPrivate });
      navigate(`/room/${data.id}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Erro');
    }
  }

  async function startEdit(room){ setEditingId(room.id); setEditingName(room.name); }
  async function saveEdit(room){
    try{
      const { data } = await api.patch(`/rooms/${room.id}`, { name: editingName });
      setRooms((rs)=>rs.map((r)=>r.id===room.id? {...r, name: data.name}: r));
      setEditingId(null);
    }catch(e){ alert(e.response?.data?.error || 'Falha ao renomear'); }
  }
  async function removeRoom(room){
    if (!confirm(`Excluir a sala "${room.name}"? Essa ação é permanente.`)) return;
    try{
      await api.delete(`/rooms/${room.id}`);
      setRooms((rs)=>rs.filter((r)=>r.id!==room.id));
      if (selectedRoom?.id === room.id) setSelectedRoom(null);
    }catch(e){ alert(e.response?.data?.error || 'Falha ao excluir'); }
  }
  function copyLink(room){
    const url = `${window.location.origin}/room/${room.id}`;
    navigator.clipboard.writeText(url).then(()=>{
      alert('Link copiado!');
    }, ()=>{
      prompt('Copie o link da sala:', url);
    });
  }
  async function createInvite(room){
    try{
      const { data } = await api.post(`/invites/room/${room.id}`, {
        expiresInHours: 24,
        maxUses: 10,
      });
      const url = `${window.location.origin}/invite/${data.token}`;
      navigator.clipboard.writeText(url).then(()=>{
        alert('Convite copiado para a área de transferência!');
      }, ()=>{
        prompt('Copie o link de convite da sala:', url);
      });
    }catch(e){
      alert(e.response?.data?.error || 'Falha ao gerar convite');
    }
  }

  const user = useMemo(()=>getUser(), []);

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-inner">
          <h2 className="title">Salas</h2>
          <form onSubmit={createRoom} className="actions" style={{marginTop:12, flexWrap:'wrap', gap:8}}>
            <input className="input" placeholder="Nome da sala" value={name} onChange={(e) => setName(e.target.value)} required />
            <label style={{display:'flex', alignItems:'center', gap:6, fontSize:13}}>
              <input type="checkbox" checked={isPrivate} onChange={(e)=>setIsPrivate(e.target.checked)} />
              Sala privada (apenas via convite)
            </label>
            <button className="btn btn-primary">Criar</button>
          </form>
          {error && <div className="error" style={{marginTop:8}}>{error}</div>}
          <ul style={{marginTop:16, paddingLeft:0, listStyle:'none'}}>
            {rooms.map((r) => (
              <li key={r.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <input type="radio" name="roomSelect" checked={selectedRoom?.id===r.id} onChange={()=>setSelectedRoom(r)} />
                  {editingId===r.id ? (
                    <input className="input" style={{maxWidth:260}} value={editingName} onChange={(e)=>setEditingName(e.target.value)} />
                  ) : (
                    <>
                      <Link className="link" to={`/room/${r.id}`}>{r.name}</Link>
                      {r.is_private ? <span style={{fontSize:11, padding:'2px 6px', borderRadius:999, border:'1px solid rgba(255,255,255,0.3)'}}>Privada</span> : null}
                    </>
                  )}
                </div>
                <div className="actions">
                  {editingId===r.id ? (
                    <>
                      <button className="btn btn-primary" onClick={()=>saveEdit(r)}>Salvar</button>
                      <button className="btn btn-ghost" onClick={()=>setEditingId(null)}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-ghost" onClick={()=>copyLink(r)}>Compartilhar</button>
                      {user && user.id === r.owner_id && (
                        <>
                          {r.is_private ? (
                            <button className="btn btn-ghost" onClick={()=>createInvite(r)}>Gerar convite</button>
                          ) : null}
                          <button className="btn btn-ghost" onClick={()=>startEdit(r)}>Renomear</button>
                          <button className="btn btn-ghost" onClick={()=>removeRoom(r)}>Excluir</button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-inner">
          <h3 className="title" style={{fontSize:18, marginBottom:8}}>Todo da sala selecionada</h3>
          {!selectedRoom && <div className="note">Selecione uma sala para ver e editar o todo list em tempo real.</div>}
          {selectedRoom && (
            <TodoList socket={socket} roomId={selectedRoom.id} showFilters />
          )}
        </div>
      </div>
    </div>
  );
}
