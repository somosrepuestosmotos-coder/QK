import express from "express";
import cors from "cors";
import pg from "pg"; // ⬅️ CAMBIO

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("."));

// --- Inicialización de la base de datos (PostgreSQL) ---
// Extrae el string de conexión de las variables de entorno (que pondremos en AWS)
const connectionString = process.env.DATABASE_URL;

// Crea un "Pool" de conexiones. Es la forma moderna de conectarse.
const db = new pg.Pool({
  connectionString: connectionString,
  // Configuración de SSL necesaria para conectarse a AWS RDS desde Beanstalk
  ssl: {
    rejectUnauthorized: false 
  }
});

const initDB = async () => {
  // Intenta conectarse
  try {
    await db.query('SELECT NOW()'); // Prueba de conexión simple
    console.log("📦 Conexión a PostgreSQL exitosa.");
  } catch (err) {
    console.error("❌ Error de conexión a PostgreSQL:", err);
  }

  // Asegura que la tabla exista
  await db.query(`
    CREATE TABLE IF NOT EXISTS respuestas (
      id SERIAL PRIMARY KEY,
      session_id TEXT,
      pregunta TEXT,
      respuesta TEXT,
      fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("📦 Tabla 'respuestas' lista.");
};

// --- Endpoint para guardar respuestas (Sintaxis de PG) ---
app.post("/api/responder", async (req, res) => {
  try {
    const { sessionId, key, value } = req.body;

    if (!sessionId || !key || !value) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // ⬇️ CAMBIO: Usamos $1, $2, $3 como parámetros
    await db.query(
      "INSERT INTO respuestas (session_id, pregunta, respuesta) VALUES ($1, $2, $3)",
      [sessionId, key, value]
    );

    console.log(`✅ Guardado: ${key} → ${value}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error al guardar respuesta:", error);
    res.status(500).json({ error: "Error al guardar en la base de datos" });
  }
});

// --- Endpoint para listar todas las respuestas (Sintaxis de PG) ---
app.get("/api/respuestas", async (req, res) => {
  try {
    // ⬇️ CAMBIO: El resultado está en 'result.rows'
    const result = await db.query("SELECT * FROM respuestas ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener respuestas:", error);
    res.status(500).json({ error: "Error al leer la base de datos" });
  }
});

// --- Iniciar servidor ---
initDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Servidor en ejecución en el puerto ${PORT}`)
  );
});