import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

export default function ChatBox({ socket, roomId, history }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState(history || []);
  const endRef = useRef(null);

  useEffect(() => { setMessages(history || []); }, [history]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [socket]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function send(e) {
    e.preventDefault();
    if (!socket) {
      alert('Você precisa estar logado e conectado para enviar mensagens.');
      return;
    }
    if (!text.trim()) return;
    const content = text.trim();
    socket.emit('chat:message', { roomId, content }, (res) => {
      if (res?.error) { alert(res.error); return; }
      if (res?.message) {
        // Garante que não duplique quando o broadcast chegar
        setMessages((m) => (m.some((x) => x.id === res.message.id) ? m : [...m, res.message]));
      }
    });
    setText('');
  }

  return (
    <div className="chat-wrap">
      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m.id || Math.random()} className={`msg`}>
            <div className="meta">{m.user_name || m.userId}</div>
            <div>{m.content}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="chat-input">
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensagem..." />
        <button className="btn btn-primary btn-send" title="Enviar">
          <Icon name="send" /> <span>Enviar</span>
        </button>
      </form>
    </div>
  );
}
