import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const protocol = request.headers['sec-websocket-protocol'];
    if (protocol === 'vite-hmr') {
      return; // Handled by Vite's internal HMR handler mounted on server
    }

    const { pathname } = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (pathname === '/ws' || pathname === '/' || pathname === '') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
      return;
    }

    socket.destroy();
  } catch {
    socket.destroy();
  }
});

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

interface PlayerSession {
  ws: WebSocket;
  id: string;
  roomId: string | null;
  username: string;
  skinId: string;
  sneakerId: string;
  trailId: string;
  lastPing: number;
}

interface Room {
  id: string;
  players: Map<string, PlayerSession>;
  seed: number;
  world: string;
  status: 'waiting' | 'in_progress' | 'ended';
  createdAt: number;
}

const sessions = new Map<WebSocket, PlayerSession>();
const rooms = new Map<string, Room>();
let matchmakingQueue: PlayerSession[] = [];

// Helper to broadcast to all players in a room except the sender
function broadcastToRoom(roomId: string, senderId: string, data: object, includeSender: boolean = false) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(data);
  room.players.forEach((player) => {
    if ((includeSender || player.id !== senderId) && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(payload);
    }
  });
}

// Clean up disconnected player
function handleDisconnect(ws: WebSocket) {
  const session = sessions.get(ws);
  if (!session) return;

  matchmakingQueue = matchmakingQueue.filter((p) => p.id !== session.id);

  if (session.roomId) {
    const room = rooms.get(session.roomId);
    if (room) {
      room.players.delete(session.id);
      broadcastToRoom(session.roomId, session.id, {
        type: 'opponent_left',
        playerId: session.id,
        username: session.username,
      });

      if (room.players.size === 0) {
        rooms.delete(session.roomId);
      }
    }
  }

  sessions.delete(ws);
}

wss.on('connection', (ws) => {
  const session: PlayerSession = {
    ws,
    id: 'p_' + Math.random().toString(36).substring(2, 9),
    roomId: null,
    username: 'Runner',
    skinId: 'speed-prodigy',
    sneakerId: 'classic-kicks',
    trailId: 'trail-none',
    lastPing: Date.now(),
  };

  sessions.set(ws, session);

  // Send handshake with player's assigned ID
  ws.send(JSON.stringify({
    type: 'connected',
    playerId: session.id,
  }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      session.lastPing = Date.now();

      switch (msg.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'set_profile':
          session.username = msg.username?.slice(0, 16) || session.username;
          session.skinId = msg.skinId || session.skinId;
          session.sneakerId = msg.sneakerId || session.sneakerId;
          session.trailId = msg.trailId || session.trailId;
          break;

        case 'quick_match': {
          session.username = msg.username?.slice(0, 16) || session.username;
          session.skinId = msg.skinId || session.skinId;
          session.sneakerId = msg.sneakerId || session.sneakerId;
          session.trailId = msg.trailId || session.trailId;

          // Remove from queue if already in
          matchmakingQueue = matchmakingQueue.filter((p) => p.id !== session.id);

          if (matchmakingQueue.length > 0) {
            // Match with first in queue!
            const opponent = matchmakingQueue.shift()!;
            if (opponent.ws.readyState === WebSocket.OPEN) {
              const roomId = 'room_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
              const roomSeed = Math.floor(Math.random() * 999999);
              const roomWorld = 'speed-city';

              const room: Room = {
                id: roomId,
                players: new Map([
                  [session.id, session],
                  [opponent.id, opponent],
                ]),
                seed: roomSeed,
                world: roomWorld,
                status: 'in_progress',
                createdAt: Date.now(),
              };

              rooms.set(roomId, room);
              session.roomId = roomId;
              opponent.roomId = roomId;

              // Notify both players match started
              const matchPayload = {
                type: 'match_start',
                roomId,
                seed: roomSeed,
                world: roomWorld,
                players: [
                  {
                    id: session.id,
                    username: session.username,
                    skinId: session.skinId,
                    sneakerId: session.sneakerId,
                    trailId: session.trailId,
                  },
                  {
                    id: opponent.id,
                    username: opponent.username,
                    skinId: opponent.skinId,
                    sneakerId: opponent.sneakerId,
                    trailId: opponent.trailId,
                  },
                ],
              };

              session.ws.send(JSON.stringify(matchPayload));
              opponent.ws.send(JSON.stringify(matchPayload));
              return;
            }
          }

          // No open opponent found yet: put in queue
          matchmakingQueue.push(session);
          ws.send(JSON.stringify({
            type: 'match_waiting',
            queuePosition: matchmakingQueue.length,
          }));
          break;
        }

        case 'cancel_matchmaking':
          matchmakingQueue = matchmakingQueue.filter((p) => p.id !== session.id);
          ws.send(JSON.stringify({ type: 'matchmaking_cancelled' }));
          break;

        case 'create_private_room': {
          session.username = msg.username?.slice(0, 16) || session.username;
          session.skinId = msg.skinId || session.skinId;
          session.sneakerId = msg.sneakerId || session.sneakerId;
          session.trailId = msg.trailId || session.trailId;

          const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
          const roomId = 'priv_' + roomCode;
          const roomSeed = Math.floor(Math.random() * 999999);

          const room: Room = {
            id: roomId,
            players: new Map([[session.id, session]]),
            seed: roomSeed,
            world: 'speed-city',
            status: 'waiting',
            createdAt: Date.now(),
          };

          rooms.set(roomId, room);
          session.roomId = roomId;

          ws.send(JSON.stringify({
            type: 'room_created',
            roomId,
            roomCode,
          }));
          break;
        }

        case 'join_private_room': {
          const roomCode = (msg.roomCode || '').toUpperCase().trim();
          const targetRoomId = 'priv_' + roomCode;
          const targetRoom = rooms.get(targetRoomId);

          if (!targetRoom || targetRoom.status !== 'waiting') {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Salle introuvable ou déjà complète.',
            }));
            return;
          }

          session.username = msg.username?.slice(0, 16) || session.username;
          session.skinId = msg.skinId || session.skinId;
          session.sneakerId = msg.sneakerId || session.sneakerId;
          session.trailId = msg.trailId || session.trailId;

          targetRoom.players.set(session.id, session);
          session.roomId = targetRoomId;
          targetRoom.status = 'in_progress';

          const matchPayload = {
            type: 'match_start',
            roomId: targetRoomId,
            seed: targetRoom.seed,
            world: targetRoom.world,
            players: Array.from(targetRoom.players.values()).map((p) => ({
              id: p.id,
              username: p.username,
              skinId: p.skinId,
              sneakerId: p.sneakerId,
              trailId: p.trailId,
            })),
          };

          targetRoom.players.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify(matchPayload));
            }
          });
          break;
        }

        case 'player_sync':
          if (!session.roomId) return;
          broadcastToRoom(session.roomId, session.id, {
            type: 'opponent_sync',
            playerId: session.id,
            x: msg.x,
            y: msg.y,
            z: msg.z,
            speed: msg.speed,
            animState: msg.animState,
            score: msg.score,
            distance: msg.distance,
            isSliding: msg.isSliding,
            isGrounded: msg.isGrounded,
          });
          break;

        case 'player_event':
          if (!session.roomId) return;
          broadcastToRoom(session.roomId, session.id, {
            type: 'opponent_event',
            playerId: session.id,
            event: msg.event, // 'jump' | 'slide' | 'celebrate' | 'near_miss' | 'powerup'
            meta: msg.meta,
          });
          break;

        case 'player_crash':
          if (!session.roomId) return;
          broadcastToRoom(session.roomId, session.id, {
            type: 'opponent_crashed',
            playerId: session.id,
            finalScore: msg.finalScore,
            finalDistance: msg.finalDistance,
          });
          break;

        case 'leave_room':
          if (session.roomId) {
            broadcastToRoom(session.roomId, session.id, {
              type: 'opponent_left',
              playerId: session.id,
            });
            const room = rooms.get(session.roomId);
            if (room) {
              room.players.delete(session.id);
              if (room.players.size === 0) rooms.delete(session.roomId);
            }
            session.roomId = null;
          }
          break;
      }
    } catch {
      // ignore bad json
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });

  ws.on('error', () => {
    handleDisconnect(ws);
  });
});

// Periodic heartbeat to clean stale connections
setInterval(() => {
  const now = Date.now();
  sessions.forEach((session, ws) => {
    if (now - session.lastPing > 45000) {
      ws.terminate();
      handleDisconnect(ws);
    }
  });
}, 20000);

// API status route
app.get('/api/multiplayer/stats', (_req, res) => {
  res.json({
    onlinePlayers: sessions.size,
    activeRooms: rooms.size,
    inQueue: matchmakingQueue.length,
  });
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Speed Rush 3D] Server listening on http://0.0.0.0:${PORT} (WS enabled)`);
  });
}

startServer();
