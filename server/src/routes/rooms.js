import express from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../db.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const userId = req.user.id;
  const rooms = await query(
    `SELECT r.id, r.name, r.is_private, r.created_at, r.owner_id
     FROM rooms r
     JOIN room_members m ON m.room_id = r.id
     WHERE m.user_id = :userId
     ORDER BY r.created_at DESC`,
    { userId }
  );
  res.json(rooms);
});

router.post('/', async (req, res) => {
  const schema = Joi.object({ name: Joi.string().min(2).max(80).required(), isPrivate: Joi.boolean().default(false) });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { name, isPrivate } = value;
  const ownerId = req.user.id;
  const result = await query('INSERT INTO rooms (name, owner_id, is_private) VALUES (:name, :owner_id, :is_private)', {
    name,
    owner_id: ownerId,
    is_private: isPrivate ? 1 : 0,
  });
  const roomId = result.insertId;
  await query('INSERT INTO room_members (room_id, user_id) VALUES (:room_id, :user_id)', { room_id: roomId, user_id: ownerId });
  res.status(201).json({ id: roomId, name, is_private: isPrivate ? 1 : 0 });
});

router.post('/:id/join', async (req, res) => {
  const userId = req.user.id;
  const roomId = parseInt(req.params.id, 10);
  const exists = await query('SELECT id, is_private FROM rooms WHERE id = :roomId', { roomId });
  if (!exists.length) return res.status(404).json({ error: 'Room not found' });
  // For private rooms, a token could be required; basic version allows join if not private.
  if (exists[0].is_private) return res.status(403).json({ error: 'Room is private' });
  const member = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId, userId });
  if (!member.length) {
    await query('INSERT INTO room_members (room_id, user_id) VALUES (:room_id, :user_id)', { room_id: roomId, user_id: userId });
  }
  res.json({ ok: true });
});

router.get('/:id/messages', async (req, res) => {
  const userId = req.user.id;
  const roomId = parseInt(req.params.id, 10);
  const member = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId, userId });
  if (!member.length) return res.status(403).json({ error: 'Not a member' });
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const rows = await query(
    `SELECT m.id, m.content, m.created_at, u.id as user_id, u.name as user_name
     FROM messages m JOIN users u ON m.user_id = u.id
     WHERE m.room_id = :roomId
     ORDER BY m.created_at DESC
     LIMIT ${limit}`,
    { roomId }
  );
  res.json(rows.reverse());
});

// Update room (rename, privacy). Only owner.
router.patch('/:id', async (req, res) => {
  const roomId = parseInt(req.params.id, 10);
  const userId = req.user.id;
  const schema = Joi.object({ name: Joi.string().min(2).max(80), isPrivate: Joi.boolean() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const room = await query('SELECT id, owner_id FROM rooms WHERE id = :roomId', { roomId });
  if (!room.length) return res.status(404).json({ error: 'Room not found' });
  if (room[0].owner_id !== userId) return res.status(403).json({ error: 'Not the owner' });
  const fields = [];
  const params = { roomId };
  if (value.name !== undefined) { fields.push('name = :name'); params.name = value.name; }
  if (value.isPrivate !== undefined) { fields.push('is_private = :is_private'); params.is_private = value.isPrivate ? 1 : 0; }
  if (!fields.length) return res.status(400).json({ error: 'No changes' });
  await query(`UPDATE rooms SET ${fields.join(', ')} WHERE id = :roomId`, params);
  const updated = (await query('SELECT id, name, is_private, created_at FROM rooms WHERE id = :roomId', { roomId }))[0];
  res.json(updated);
});

// Delete room. Only owner. Cascades remove members/messages/todos by FK.
router.delete('/:id', async (req, res) => {
  const roomId = parseInt(req.params.id, 10);
  const userId = req.user.id;
  const room = await query('SELECT id, owner_id FROM rooms WHERE id = :roomId', { roomId });
  if (!room.length) return res.status(404).json({ error: 'Room not found' });
  if (room[0].owner_id !== userId) return res.status(403).json({ error: 'Not the owner' });
  await query('DELETE FROM rooms WHERE id = :roomId', { roomId });
  res.json({ ok: true });
});

export default router;
