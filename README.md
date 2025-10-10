ChatOnline — React + Node.js + MySQL

Overview
- Autenticação com JWT, hash de senha (bcrypt).
- Salas com chat em tempo real (Socket.IO).
- Videoconferência via WebRTC (sinalização pelo Socket.IO).
- Todo list colaborativo, sincronizado em tempo real.
- MySQL para persistência (usuarios, salas, mensagens, todos).
- Segurança básica: Helmet, CORS, rate limiting, validações com Joi.

Estrutura
- server: API Express, Socket.IO e integração MySQL.
- client: App React (Vite) com chat, vídeo e todo list.

Pré‑requisitos
- Node.js 18+ e npm ou pnpm.
- MySQL 8+.

Configurar banco
1) Crie o database: `CREATE DATABASE chatonline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2) Importe o schema: `server/db/schema.sql`.

Configurar servidor
1) Copie `server/.env.example` para `server/.env` e ajuste credenciais/segredos.
2) Instale deps: `cd server && npm i`.
3) Rode: `npm run dev` (ou `npm start`).

Configurar cliente
1) Instale deps: `cd client && npm i`.
2) Rode: `npm run dev`.
3) Acesse: `http://localhost:5173` (o server padrão é `http://localhost:4000`).

Fluxo principal
- Crie conta ou faça login.
- Crie uma sala no Lobby.
- Ao entrar na sala: vídeo (WebRTC), chat e todo list em tempo real.

Segurança e performance
- Helmet + CORS + rate‑limit em rotas sensíveis.
- JWT com expiração configurável.
- Validação de entrada (Joi) no backend.
- SQL com placeholders nomeados (mysql2/promise) para evitar injection.
- Compressão HTTP e WebSocket ping tuning.

Observações WebRTC
- Implementação usa STUN público (Google). Para produção, configure servidores STUN/TURN próprios para confiabilidade atrás de NAT/CGNAT.
- Sinalização é feita via `webrtc:signal` no Socket.IO.

Scripts úteis
- Server: `npm run dev` (hot reload com nodemon), `npm start`.
- Client: `npm run dev`, `npm run build`, `npm run preview`.

Pontos para evoluir
- Convites de sala com tokens para salas privadas.
- Gravação/compartilhamento de tela.
- Refresh tokens e revogação.
- Testes automatizados e CI.

