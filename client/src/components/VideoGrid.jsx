import React, { useEffect, useRef, useState } from 'react';
import { createPeerConnection, getLocalStream } from '../webrtc';

export default function VideoGrid({ socket, roomId }) {
  const localVideoRef = useRef(null);
  const [peers, setPeers] = useState({}); // socketId -> { pc, stream }
  const localStreamRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stream = await getLocalStream({ audio: true, video: true });
      if (!mounted) return;
      localStreamRef.current = stream;
      // Apply initial toggles
      const [a] = stream.getAudioTracks(); if (a) a.enabled = micOn;
      const [v] = stream.getVideoTracks(); if (v) v.enabled = camOn;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      socket.emit('joinRoom', { roomId }, (res) => { if (res?.error) alert(res.error); });
    })();
    return () => { mounted = false; Object.values(peers).forEach(({ pc }) => pc.close()); };
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    async function createAndOffer() {
      // Ask others to create connections when we join
      const pc = createPeerConnection();
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
      pc.onicecandidate = (e) => e.candidate && socket.emit('webrtc:signal', { roomId, data: { candidate: e.candidate } });
      pc.ontrack = (e) => addRemote('broadcast', e.streams[0], pc);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc:signal', { roomId, data: { offer } });
    }

    function addRemote(id, stream, pc) {
      setPeers((p) => {
        if (p[id]) return p;
        return { ...p, [id]: { pc, stream } };
      });
    }

    const onSignal = async ({ from, data }) => {
      let entry = peers[from];
      if (!entry) {
        const pc = createPeerConnection();
        localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
        pc.onicecandidate = (e) => e.candidate && socket.emit('webrtc:signal', { roomId, to: from, data: { candidate: e.candidate } });
        pc.ontrack = (e) => addRemote(from, e.streams[0], pc);
        entry = { pc };
        setPeers((p) => ({ ...p, [from]: entry }));
      }
      const { pc } = entry;
      if (data.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:signal', { roomId, to: from, data: { answer } });
      } else if (data.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch {}
      }
    };

    socket.on('webrtc:signal', onSignal);
    // Kick off an initial offer broadcast to others
    createAndOffer();
    return () => socket.off('webrtc:signal', onSignal);
  }, [socket, roomId, peers]);

  return (
    <div>
      <h3>Video</h3>
      <div className="actions" style={{gap:8, margin:'8px 0'}}>
        <button className="btn btn-ghost" onClick={() => {
          const [t] = localStreamRef.current?.getAudioTracks() || [];
          if (t) { t.enabled = !t.enabled; setMicOn(t.enabled); }
        }}>{micOn ? 'Mutar microfone' : 'Ativar microfone'}</button>
        <button className="btn btn-ghost" onClick={() => {
          const [t] = localStreamRef.current?.getVideoTracks() || [];
          if (t) { t.enabled = !t.enabled; setCamOn(t.enabled); }
        }}>{camOn ? 'Desligar câmera' : 'Ligar câmera'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
        <video ref={localVideoRef} autoPlay muted playsInline style={{ background: '#000', width: '100%', height: 150, opacity: camOn ? 1 : .5 }} />
        {Object.entries(peers).map(([id, { stream }]) => (
          <Video key={id} stream={stream} />
        ))}
      </div>
    </div>
  );
}

function Video({ stream }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <video autoPlay playsInline ref={ref} style={{ background: '#000', width: '100%', height: 150 }} />;
}
