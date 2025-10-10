import express from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../db.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/:roomId', async (req, res) => {
  const roomId = parseInt(req.params.roomId, 10);
  const userId = req.user.id;
  const member = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId, userId });
  if (!member.length) return res.status(403).json({ error: 'Not a member' });
  const status = String(req.query.status || 'all'); // all | active | completed
  const q = String(req.query.q || '').trim();
  let sql = 'SELECT id, text, completed, created_at, updated_at FROM todo_items WHERE room_id = :roomId';
  const params = { roomId };
  if (status === 'active') sql += ' AND completed = 0';
  if (status === 'completed') sql += ' AND completed = 1';
  if (q) { sql += ' AND text LIKE :q'; params.q = `%${q}%`; }
  sql += ' ORDER BY created_at ASC';
  const items = await query(sql, params);
  res.json(items);
});

router.post('/:roomId', async (req, res) => {
  const schema = Joi.object({ text: Joi.string().min(1).max(255).required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const roomId = parseInt(req.params.roomId, 10);
  const userId = req.user.id;
  const member = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId, userId });
  if (!member.length) return res.status(403).json({ error: 'Not a member' });
  const result = await query('INSERT INTO todo_items (room_id, text, completed) VALUES (:roomId, :text, 0)', { roomId, text: value.text });
  const item = await query('SELECT id, text, completed, created_at, updated_at FROM todo_items WHERE id = :id', { id: result.insertId });
  res.status(201).json(item[0]);
});

router.put('/item/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const schema = Joi.object({ text: Joi.string().min(1).max(255), completed: Joi.boolean() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  // Ensure user has access by checking room membership through the item
  const itemRows = await query('SELECT room_id FROM todo_items WHERE id = :id', { id });
  if (!itemRows.length) return res.status(404).json({ error: 'Item not found' });
  const roomId = itemRows[0].room_id;
  const member = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId, userId: req.user.id });
  if (!member.length) return res.status(403).json({ error: 'Not a member' });
  const fields = [];
  const params = { id };
  if (value.text !== undefined) { fields.push('text = :text'); params.text = value.text; }
  if (value.completed !== undefined) { fields.push('completed = :completed'); params.completed = value.completed ? 1 : 0; }
  if (!fields.length) return res.status(400).json({ error: 'No changes' });
  await query(`UPDATE todo_items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = :id`, params);
  const updated = await query('SELECT id, text, completed, created_at, updated_at FROM todo_items WHERE id = :id', { id });
  res.json(updated[0]);
});

router.delete('/item/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const itemRows = await query('SELECT room_id FROM todo_items WHERE id = :id', { id });
  if (!itemRows.length) return res.status(404).json({ error: 'Item not found' });
  const roomId = itemRows[0].room_id;
  const member = await query('SELECT 1 FROM room_members WHERE room_id = :roomId AND user_id = :userId', { roomId, userId: req.user.id });
  if (!member.length) return res.status(403).json({ error: 'Not a member' });
  await query('DELETE FROM todo_items WHERE id = :id', { id });
  res.json({ ok: true });
});

export default router;
