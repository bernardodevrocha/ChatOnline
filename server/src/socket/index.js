import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/auth.js';
import { query } from '../db.js';

export function createSocketServer(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
    pingInterval: 20000,
    pingTimeout: 20000,
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const user = socket.user;

    socket.on('joinRoom', async ({ roomId }, cb) => {
      try {
        const rows = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId, userId: user.id });
        if (!rows.length) return cb?.({ error: 'Not a member' });
        socket.join(`room:${roomId}`);
        socket.to(`room:${roomId}`).emit('presence:join', { userId: user.id, name: user.name });
        cb?.({ ok: true });
      } catch (e) { cb?.({ error: 'Failed to join' }); }
    });

    socket.on('leaveRoom', ({ roomId }) => {
      socket.leave(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('presence:leave', { userId: user.id });
    });

    socket.on('chat:message', async ({ roomId, content }, cb) => {
      try {
        const rows = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId, userId: user.id });
        if (!rows.length) return cb?.({ error: 'Not a member' });
        const result = await query('INSERT INTO messages (room_id, user_id, content) VALUES (:roomId, :userId, :content)', { roomId, userId: user.id, content: String(content || '').slice(0, 1000) });
        const message = { id: result.insertId, room_id: roomId, user_id: user.id, user_name: user.name, content, created_at: new Date().toISOString() };
        io.to(`room:${roomId}`).emit('chat:message', message);
        cb?.({ ok: true, message });
      } catch (e) { cb?.({ error: 'Failed to send message' }); }
    });

    // Todo list events
    socket.on('todo:create', async ({ roomId, text }, cb) => {
      try {
        const rows = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId, userId: user.id });
        if (!rows.length) return cb?.({ error: 'Not a member' });
        const result = await query('INSERT INTO todo_items (room_id, text, completed) VALUES (:roomId, :text, 0)', { roomId, text: String(text || '').slice(0,255) });
        const item = (await query('SELECT id, text, completed, created_at, updated_at FROM todo_items WHERE id = :id', { id: result.insertId }))[0];
        io.to(`room:${roomId}`).emit('todo:created', item);
        cb?.({ ok: true, item });
      } catch (e) { cb?.({ error: 'Failed to create todo' }); }
    });

    socket.on('todo:update', async ({ id, text, completed }, cb) => {
      try {
        const it = (await query('SELECT room_id FROM todo_items WHERE id = :id', { id }))[0];
        if (!it) return cb?.({ error: 'Not found' });
        const rows = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId: it.room_id, userId: user.id });
        if (!rows.length) return cb?.({ error: 'Not a member' });
        const fields = [];
        const params = { id };
        if (text !== undefined) { fields.push('text = :text'); params.text = String(text || '').slice(0,255); }
        if (completed !== undefined) { fields.push('completed = :completed'); params.completed = completed ? 1 : 0; }
        if (!fields.length) return cb?.({ error: 'No changes' });
        await query(`UPDATE todo_items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = :id`, params);
        const updated = (await query('SELECT id, text, completed, created_at, updated_at FROM todo_items WHERE id = :id', { id }))[0];
        io.to(`room:${it.room_id}`).emit('todo:updated', updated);
        cb?.({ ok: true, item: updated });
      } catch (e) { cb?.({ error: 'Failed to update todo' }); }
    });

    socket.on('todo:delete', async ({ id }, cb) => {
      try {
        const it = (await query('SELECT room_id FROM todo_items WHERE id = :id', { id }))[0];
        if (!it) return cb?.({ error: 'Not found' });
        const rows = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId: it.room_id, userId: user.id });
        if (!rows.length) return cb?.({ error: 'Not a member' });
        await query('DELETE FROM todo_items WHERE id = :id', { id });
        io.to(`room:${it.room_id}`).emit('todo:deleted', { id });
        cb?.({ ok: true });
      } catch (e) { cb?.({ error: 'Failed to delete todo' }); }
    });

    // WebRTC signaling (room-wide mesh)
    socket.on('webrtc:signal', ({ roomId, to, data }) => {
      // If direct target provided, emit to that socket id; else broadcast to room
      if (to) io.to(to).emit('webrtc:signal', { from: socket.id, data });
      else socket.to(`room:${roomId}`).emit('webrtc:signal', { from: socket.id, data });
    });

    socket.on('disconnecting', () => {
      // Could emit presence:leave for each room if needed
    });
  });

  return io;
}

