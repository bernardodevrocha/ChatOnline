import http from 'http';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import roomsRoutes from './routes/rooms.js';
import todosRoutes from './routes/todos.js';
import invitesRoutes from './routes/invites.js';
import { createSocketServer } from './socket/index.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);
app.use('/rooms', roomsRoutes);
app.use('/todos', todosRoutes);
app.use('/invites', invitesRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const server = http.createServer(app);
createSocketServer(server, config.clientOrigin);

server.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});
