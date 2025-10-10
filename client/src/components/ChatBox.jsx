import React, { useEffect, useRef, useState } from 'react';

export default function ChatBox({ socket, roomId, history }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState(history || []);
  const endRef = useRef(null);

  useEffect(() => { setMessages(history || []); }, [history]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => setMessages((m) => [...m, msg]);
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [socket]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('chat:message', { roomId, content: text.trim() }, (res) => {
      if (res?.error) alert(res.error);
    });
    setText('');
  }

  return (
    <div style={{ height: 300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {messages.map((m) => (
          <div key={m.id || Math.random()}>
            <b>{m.user_name || m.userId}:</b> {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensagem..." />
        <button className="btn btn-primary">Enviar</button>
      </form>
    </div>
  );
}
