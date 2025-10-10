import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

export default function TodoList({ socket, roomId, showFilters }) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('all'); // all | active | completed
  const [search, setSearch] = useState('');

  async function load() {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (search.trim()) params.set('q', search.trim());
    const qs = params.toString();
    const { data } = await api.get(`/todos/${roomId}${qs ? `?${qs}` : ''}`);
    setItems(data);
  }

  useEffect(() => { load(); }, [roomId, status, search]);

  useEffect(() => {
    if (!socket) return;
    const onCreated = (item) => setItems((it) => [...it, item]);
    const onUpdated = (item) => setItems((it) => it.map((x) => x.id === item.id ? item : x));
    const onDeleted = ({ id }) => setItems((it) => it.filter((x) => x.id !== id));
    socket.on('todo:created', onCreated);
    socket.on('todo:updated', onUpdated);
    socket.on('todo:deleted', onDeleted);
    return () => {
      socket.off('todo:created', onCreated);
      socket.off('todo:updated', onUpdated);
      socket.off('todo:deleted', onDeleted);
    };
  }, [socket]);

  function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('todo:create', { roomId, text }, (res) => { if (res?.error) alert(res.error); });
    setText('');
  }

  function toggle(item) {
    socket.emit('todo:update', { id: item.id, completed: !item.completed }, (res) => { if (res?.error) alert(res.error); });
  }

  function remove(item) {
    socket.emit('todo:delete', { id: item.id }, (res) => { if (res?.error) alert(res.error); });
  }

  const visible = useMemo(() => {
    return items.filter((it) => {
      if (status === 'active' && it.completed) return false;
      if (status === 'completed' && !it.completed) return false;
      if (search.trim() && !it.text.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [items, status, search]);

  return (
    <div>
      <h3 className="title" style={{fontSize:18}}>Todo List</h3>
      {showFilters && (
        <div className="actions" style={{gap:8, marginTop:8}}>
          <select className="input" value={status} onChange={(e)=>setStatus(e.target.value)} style={{maxWidth:160}}>
            <option value="all">Todos</option>
            <option value="active">Abertos</option>
            <option value="completed">Concluídos</option>
          </select>
          <input className="input" placeholder="Buscar..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          <button className="btn btn-ghost" onClick={()=>{ setStatus('all'); setSearch(''); }}>Limpar</button>
        </div>
      )}
      <form onSubmit={add} className="actions" style={{marginTop:10}}>
        <input className="input" placeholder="Novo item" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary">Adicionar</button>
      </form>
      <ul style={{marginTop:12, lineHeight:1.8, paddingLeft:0, listStyle:'none'}}>
        {visible.map((it) => (
          <li key={it.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0'}}>
            <label style={{display:'flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={!!it.completed} onChange={() => toggle(it)} /> <span>{it.text}</span>
            </label>
            <button className="btn btn-ghost" onClick={() => remove(it)} title="Remover">Remover</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
