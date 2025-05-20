//Configuración de dependencias
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
require('dotenv').config();


const { logger, createModuleLogger } = require("./utils/logger");
const { testConnection } = require('./utils/cloudinary');

//rutas de contenido
const writingsRoutes = require("./routes/WritingsRoutes");
const paintingsRoutes = require("./routes/PaintingsRoutes");
const photographyRoutes = require("./routes/PhotographyRoutes");
const musicRoutes = require("./routes/MusicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const biographyRoutes = require("./routes/BiographyRoutes");
const designRoutes = require("./routes/DesignRoutes");
const digitalArtRoutes = require("./routes/DigitalArtRoutes");

//configuración
const mongoose = require("mongoose");
const conexion = require("./database");
require("dotenv").config();

const appLogger = createModuleLogger("app");


const app = express();

//configuración de cors
const corsOptions = {
  origin: (origin, callback) => {
    console.log('[CORS] Origin recibido:', origin);
    const env = process.env.NODE_ENV || 'development';
    const allowedOrigins = ['https://www.zigzagworx.com', 'https://zigzagworx.com'];
    if (!origin) {
      // Permitir peticiones sin origen (como Postman)
      console.warn('[CORS] Sin origen - permitido');
      return callback(null, true);
    }

    if (env === 'development') {
      // Permitir todos los orígenes en desarrollo
      console.log(`[CORS] [DEV] Origen permitido automáticamente: ${origin}`);
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log(`[CORS] [PROD] Origen permitido: ${origin}`);
      return callback(null, true);
    } else {
      console.error(`[CORS] [PROD] Origen bloqueado: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

//configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_PATH);
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + "-" + file.originalname;
    cb(null, filename);
  },
});

//filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(",");
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

//configuración de helmet
app.use(helmet());

//configuración de rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true, // agrega RateLimit-* headers
  legacyHeaders: false,  // desactiva X-RateLimit-* (opcional)
});

// Aplicar rate limiter a todas las rutas excepto /health
app.use((req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  limiter(req, res, next);
});

//configuración de express
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  const startTime = Date.now();

  appLogger.info({
    type: "request",
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.on("finish", () => {
    appLogger.info({
      type: "response",
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${Date.now() - startTime}ms`,
    });
  });

  next();
});

//health check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Add routes
app.use("/api", writingsRoutes);
app.use("/api", paintingsRoutes);
app.use("/api", photographyRoutes);
app.use("/api", musicRoutes);
app.use("/api", biographyRoutes);
app.use("/api", designRoutes);
app.use("/api", digitalArtRoutes);
app.use("/api", adminRoutes);

app.use((err, req, res, next) => {
  console.error('ERROR GLOBAL:', err.stack);
  
  appLogger.error({
    type: "error",
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    timestamp: new Date().toISOString(),
  });
  
  res.status(500).send('Algo salió mal!');
});

//testing
app.get("/test", (req, res) => {
  res.json({ message: "Test route working" });
});

//debug
app.get("/api/debug", async (req, res) => {
  try {
      if (mongoose.connection.readyState !== 1) {
          return res.json({ error: "Database not connected" });
      }

      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();

      // Debug collections
      const writingsCollection = collections.find((c) => c.name === "Writings");
      const writingsData = writingsCollection
          ? await db.collection("Writings").find({}).toArray()
          : [];

      const paintingsCollection = collections.find((c) => c.name === "Paintings");
      const paintingsData = paintingsCollection
          ? await db.collection("Paintings").find({}).toArray()
          : [];

      const musicCollection = collections.find((c) => c.name === "Music");
      const musicData = musicCollection
          ? await db.collection("Music").find({}).toArray()
          : [];

      const photographyCollection = collections.find((c) => c.name === "Photography");
      const photographyData = photographyCollection
          ? await db.collection("Photography").find({}).toArray()
          : [];

      const designCollection = collections.find((c) => c.name === "Designs");
      const designData = designCollection
          ? await db.collection("Designs").find({}).toArray()
          : [];

      const biographyCollection = collections.find((c) => c.name === "Biography");
      const biographyData = biographyCollection
          ? await db.collection("Biography").find({}).toArray()
          : [];

      const digitalArtCollection = collections.find((c) => c.name === "Digital");
      const digitalArtData = digitalArtCollection
          ? await db.collection("Digital").find({}).toArray()
          : [];

      res.json({
          availableCollections: collections.map((c) => c.name),
          writings: {
              collectionExists: !!writingsCollection,
              collectionName: writingsCollection?.name,
              documentCount: writingsData.length,
              documents: writingsData,
          },
          paintings: {
              collectionExists: !!paintingsCollection,
              collectionName: paintingsCollection?.name,
              documentCount: paintingsData.length,
              documents: paintingsData,
          },
          music: {
              collectionExists: !!musicCollection,
              collectionName: musicCollection?.name,
              documentCount: musicData.length,
              documents: musicData,
          },
          photography: {
              collectionExists: !!photographyCollection,
              collectionName: photographyCollection?.name,
              documentCount: photographyData.length,
              documents: photographyData,
          },
          designs: {
              collectionExists: !!designCollection,
              collectionName: designCollection?.name,
              documentCount: designData.length,
              documents: designData,
          },
          biography: {
              collectionExists: !!biographyCollection,
              collectionName: biographyCollection?.name,
              documentCount: biographyData.length,
              documents: biographyData,
          },
          digitalArt: {
              collectionExists: !!digitalArtCollection,
              collectionName: digitalArtCollection?.name,
              documentCount: digitalArtData.length,
              documents: digitalArtData,
          },
      });
  } catch (error) {
      console.error("Debug route error:", error);
      res.json({ error: error.message, stack: error.stack });
  }
});
// Add this near your other test routes
app.get("/api/test-cloudinary", async (req, res) => {
    try {
        const testResult = await testConnection();
        res.json({
            success: testResult,
            config: {
                cloudName: process.env.CLOUDINARY_NAME,
                hasApiKey: !!process.env.CLOUDINARY_API_KEY,
                hasSecret: !!process.env.CLOUDINARY_SECRET
            }
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Agregar estos manejadores de errores no capturados
process.on('uncaughtException', (error) => {
  appLogger.error({
    type: "uncaught_exception",
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  // No cerramos el proceso para evitar que se reinicie
});

process.on('unhandledRejection', (reason, promise) => {
  appLogger.error({
    type: "unhandled_rejection",
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : "No stack trace available",
    timestamp: new Date().toISOString(),
  });
  // No cerramos el proceso para evitar que se reinicie
});

// Mejorar la conexión a la base de datos
mongoose.connection.on('error', (err) => {
  appLogger.error({
    type: "mongodb_connection_error",
    error: err.message,
    timestamp: new Date().toISOString(),
  });
});

mongoose.connection.on('disconnected', () => {
  appLogger.warn({
    type: "mongodb_disconnected",
    timestamp: new Date().toISOString(),
  });
  // Intentar reconectar
  setTimeout(() => {
    appLogger.info({
      type: "mongodb_reconnect_attempt",
      timestamp: new Date().toISOString(),
    });
    mongoose.connect(process.env.MONGODB_URI);
  }, 5000);
});

//inicio del servidor
const puerto = process.env.PORT || 3000;

app.listen(puerto, () => {
  appLogger.info({
    type: "server_start",
    port: puerto,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  // Esto no bloquea el inicio
  testConnection().catch(error => {
    appLogger.error({
      type: "cloudinary_connection_error",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  });
});

//cierre del servidor
process.on("SIGTERM", () => {
  appLogger.info({
    type: "server_shutdown",
    timestamp: new Date().toISOString(),
  });
  process.exit(0);
});
