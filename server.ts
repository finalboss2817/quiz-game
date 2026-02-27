import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("game.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    score INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    owner_id TEXT,
    status TEXT DEFAULT 'waiting'
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Socket.io logic
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", ({ roomId, username }) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          players: [],
          questions: generateQuestions(),
          currentQuestionIndex: 0,
          scores: {},
          status: 'lobby'
        });
      }
      
      const room = rooms.get(roomId);
      
      // Prevent duplicate entries for the same socket
      const playerExists = room.players.find((p: any) => p.id === socket.id);
      if (!playerExists) {
        room.players.push({ id: socket.id, username });
        room.scores[socket.id] = 0;
      }

      console.log(`User ${username} joined room ${roomId}. Total players: ${room.players.length}`);

      io.to(roomId).emit("room-update", {
        players: room.players,
        status: room.status,
      });
    });

    socket.on("start-game", (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.status = "playing";
        io.to(roomId).emit("game-started", {
          questions: room.questions,
        });
      }
    });

    socket.on("submit-answer", ({ roomId, score, username }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.scores[socket.id] = (room.scores[socket.id] || 0) + score;
        io.to(roomId).emit("score-update", room.scores);

        // Update database
        try {
          const stmt = db.prepare("INSERT OR REPLACE INTO users (id, username, score) VALUES (?, ?, ?)");
          const existing = db.prepare("SELECT score FROM users WHERE username = ?").get(username) as any;
          const newScore = (existing?.score || 0) + score;
          stmt.run(username, username, newScore);
        } catch (err) {
          console.error("DB Error:", err);
        }
      }
    });

    socket.on("battlefield-score", ({ username, score }) => {
      try {
        const stmt = db.prepare("INSERT OR REPLACE INTO users (id, username, score) VALUES (?, ?, ?)");
        const existing = db.prepare("SELECT score FROM users WHERE username = ?").get(username) as any;
        const newScore = (existing?.score || 0) + score;
        stmt.run(username, username, newScore);
      } catch (err) {
        console.error("DB Error:", err);
      }
    });
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Cleanup rooms
      rooms.forEach((room, roomId) => {
        room.players = room.players.filter((p: any) => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit("room-update", {
            players: room.players,
            status: room.status,
          });
        }
      });
    });
  });

  app.get("/api/leaderboard", (req, res) => {
    const topUsers = db.prepare("SELECT username, score FROM users ORDER BY score DESC LIMIT 10").all();
    res.json(topUsers);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

function generateQuestions() {
  // Mock HSC questions for now
  return [
    {
      id: 1,
      question: "What is the unit of electric current?",
      options: ["Volt", "Ampere", "Ohm", "Watt"],
      correct: 1,
      subject: "Physics"
    },
    {
      id: 2,
      question: "Which of the following is a noble gas?",
      options: ["Oxygen", "Nitrogen", "Helium", "Hydrogen"],
      correct: 2,
      subject: "Chemistry"
    },
    {
      id: 3,
      question: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"],
      correct: 2,
      subject: "Biology"
    },
    {
      id: 4,
      question: "If f(x) = x^2, what is f'(x)?",
      options: ["x", "2x", "x^2", "2"],
      correct: 1,
      subject: "Math"
    },
    {
      id: 5,
      question: "Which law states that V = IR?",
      options: ["Newton's Law", "Ohm's Law", "Boyle's Law", "Charles's Law"],
      correct: 1,
      subject: "Physics"
    }
  ];
}

startServer();
