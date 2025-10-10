import express from 'express';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import { query } from '../db.js';
import { hashPassword, comparePassword } from '../utils/passwords.js';
import { signJwt } from '../middleware/auth.js';

const router = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
router.use(limiter);

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
});

router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { name, email, password } = value;
  const existing = await query('SELECT id FROM users WHERE email = :email', { email });
  if (existing.length) return res.status(409).json({ error: 'Email already registered' });
  const password_hash = await hashPassword(password);
  const result = await query(
    'INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :password_hash)',
    { name, email, password_hash }
  );
  const userId = result.insertId;
  const token = signJwt({ id: userId, email, name });
  res.json({ token, user: { id: userId, name, email } });
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { email, password } = value;
  const rows = await query('SELECT id, name, email, password_hash FROM users WHERE email = :email', { email });
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
  const user = rows[0];
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signJwt({ id: user.id, email: user.email, name: user.name });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

export default router;

