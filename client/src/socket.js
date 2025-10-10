import { io } from 'socket.io-client';
import { API_URL } from './api';

let socket;

export function getSocket() {
  const token = localStorage.getItem('token');
  if (!socket) {
    socket = io(API_URL, { transports: ['websocket'], auth: { token } });
    socket.on('connect_error', (err) => console.error('socket error', err.message));
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

