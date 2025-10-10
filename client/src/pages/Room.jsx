import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { getSocket } from '../socket';
import ChatBox from '../components/ChatBox';
import TodoList from '../components/TodoList';
import VideoGrid from '../components/VideoGrid';

export default function Room() {
  const { id } = useParams();
  const roomId = parseInt(id, 10);
  const [socket, setSocket] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      const s = getSocket();
      setSocket(s);
      // Tenta entrar na sala (para links compartilhados em salas públicas)
      try { await api.post(`/rooms/${roomId}/join`); } catch {}
      try {
        const { data } = await api.get(`/rooms/${roomId}/messages?limit=50`);
        setHistory(data);
      } catch (e) {
        // Caso ainda não tenha acesso, ignore e aguarde entrada pelo socket
      }
      s.emit('joinRoom', { roomId }, (res) => { if (res?.error) alert(res.error); });
    })();
  }, [roomId]);

  return (
    <div className="grid-2">
      <div className="card"><div className="card-inner">
        <div className="actions" style={{justifyContent:'space-between'}}>
          <h2 className="title" style={{margin:0}}>Sala</h2>
          <button className="btn btn-ghost" onClick={()=>{
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(()=>alert('Link copiado!'),()=>prompt('Copie o link:', url));
          }}>Compartilhar link</button>
        </div>
        <VideoGrid socket={socket} roomId={roomId} />
      </div></div>
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="card"><div className="card-inner">
          <ChatBox socket={socket} roomId={roomId} history={history} />
        </div></div>
        <div className="card"><div className="card-inner">
          <TodoList socket={socket} roomId={roomId} showFilters />
        </div></div>
      </div>
    </div>
  );
}
