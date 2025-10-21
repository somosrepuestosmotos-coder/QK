import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Sirve index.html, admin.html, videos, etc.

// --- Inicialización de la base de datos ---
let db;

const initDB = async () => {
  db = await open({
    filename: "./bd.sql", // asegúrate que este sea el nombre correcto de tu base
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS respuestas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      pregunta TEXT,
      respuesta TEXT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("📦 Base de datos SQLite lista.");
};

initDB();

// --- Endpoint para guardar respuestas ---
app.post("/api/responder", async (req, res) => {
  try {
    const { sessionId, key, value } = req.body;

    if (!sessionId || !key || !value) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    await db.run(
      "INSERT INTO respuestas (session_id, pregunta, respuesta) VALUES (?, ?, ?)",
      [sessionId, key, value]
    );

    console.log(`✅ Guardado: ${key} → ${value}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error al guardar respuesta:", error);
    res.status(500).json({ error: "Error al guardar en la base de datos" });
  }
});

// --- Endpoint para listar todas las respuestas ---
app.get("/api/respuestas", async (req, res) => {
  try {
    const rows = await db.all("SELECT * FROM respuestas ORDER BY fecha DESC");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener respuestas:", error);
    res.status(500).json({ error: "Error al leer la base de datos" });
  }
});

// --- Iniciar servidor ---
app.listen(PORT, () =>
  console.log(`🚀 Servidor en ejecución: http://localhost:${PORT}`)
);
