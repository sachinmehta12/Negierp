import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { sequelize } from './models';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, health checks)
    if (!origin) {
      return callback(null, true);
    }
    const extraOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
      : [];
    const allowedOrigins = [
      'https://negierp.vercel.app',
      'http://localhost:4200',
      ...extraOrigins
    ];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: config.institute.name,
    tagline: config.institute.tagline,
    database: 'MySQL',
    timestamp: new Date().toISOString()
  });
});

// Root API Information
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to NEGI TUTORIALS REST API Engine (MySQL)',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'online'
  });
});

// Mount modular API routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = config.port;

async function startServer() {
  try {
    // Authenticate Sequelize connection to MySQL
    await sequelize.authenticate();
    console.log('✅ Sequelize MySQL Connection established successfully.');

    // Keep sequelize.sync({ alter: true }) to create and update MySQL tables
    await sequelize.sync({ alter: true });
    console.log('✅ Sequelize Models Synced: MySQL Tables Verified and Created Successfully ({ alter: true }).');

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`  🚀 NEGI TUTORIALS REST API Server Running`);
      console.log(`  📡 Port: http://localhost:${PORT}`);
      console.log(`  🩺 Health: http://localhost:${PORT}/api/health`);
      console.log(`  🛡️ Mode: ${config.nodeEnv}`);
      console.log(`  🗄️ Database: MySQL (${config.dbHost}:${config.dbPort}/${config.dbName})`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database or sync Sequelize models:', error);
    process.exit(1);
  }
}

startServer();

export default app;
