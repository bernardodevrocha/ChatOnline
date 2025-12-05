import express from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(authMiddleware);

// Create invite for a (typically private) room - only owner
router.post('/room/:id', async (req, res) => {
  const roomId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  const schema = Joi.object({
    expiresInHours: Joi.number().integer().min(1).max(24 * 30).allow(null),
    maxUses: Joi.number().integer().min(1).max(1000).allow(null),
  });
  const { error, value } = schema.validate(req.body || {});
  if (error) return res.status(400).json({ error: error.message });

  const room = await query('SELECT id, owner_id, is_private FROM rooms WHERE id = :roomId', { roomId });
  if (!room.length) return res.status(404).json({ error: 'Room not found' });
  if (room[0].owner_id !== userId) return res.status(403).json({ error: 'Not the owner' });

  const token = uuidv4().replace(/-/g, '');

  let expiresAt = null;
  if (value.expiresInHours) {
    const ms = value.expiresInHours * 60 * 60 * 1000;
    expiresAt = new Date(Date.now() + ms);
  }

  const result = await query(
    'INSERT INTO room_invites (room_id, token, created_by, expires_at, max_uses) VALUES (:room_id, :token, :created_by, :expires_at, :max_uses)',
    {
      room_id: roomId,
      token,
      created_by: userId,
      expires_at: expiresAt,
      max_uses: value.maxUses ?? null,
    }
  );

  res.status(201).json({
    id: result.insertId,
    room_id: roomId,
    token,
    expires_at: expiresAt,
    max_uses: value.maxUses ?? null,
  });
});

// Redeem invite token: join the room and return room info
router.post('/:token', async (req, res) => {
  const { token } = req.params;
  const userId = req.user.id;

  const rows = await query(
    `SELECT i.id, i.room_id, i.expires_at, i.max_uses, i.uses,
            r.name, r.is_private, r.owner_id
     FROM room_invites i
     JOIN rooms r ON r.id = i.room_id
     WHERE i.token = :token`,
    { token }
  );
  if (!rows.length) return res.status(404).json({ error: 'Invite not found' });

  const invite = rows[0];
  const now = new Date();
  if (invite.expires_at && now > invite.expires_at) {
    return res.status(410).json({ error: 'Invite expired' });
  }
  if (invite.max_uses !== null && invite.uses >= invite.max_uses) {
    return res.status(410).json({ error: 'Invite reached max uses' });
  }

  const member = await query(
    'SELECT 1 FROM room_members WHERE room_id = :room_id AND user_id = :user_id',
    { room_id: invite.room_id, user_id: userId }
  );
  if (!member.length) {
    await query('INSERT INTO room_members (room_id, user_id) VALUES (:room_id, :user_id)', {
      room_id: invite.room_id,
      user_id: userId,
    });
  }

  await query('UPDATE room_invites SET uses = uses + 1 WHERE id = :id', { id: invite.id });

  res.json({
    room: {
      id: invite.room_id,
      name: invite.name,
      is_private: invite.is_private,
      owner_id: invite.owner_id,
    },
  });
});

export default router;

