import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import profileRoutes from './routes/profile.routes';
import icpRoutes from './routes/icp.routes';
import contentRoutes from './routes/content.routes';
import contentIdeasRoutes from './routes/content-ideas.routes';
import leadRoutes from './routes/lead.routes';
import salesMachineRoutes from './routes/sales-machine.routes';
import intelligenceRoutes from './routes/intelligence.routes';
import intelligenceEngineRoutes from './routes/intelligence-engine.routes';
import closedLoopRoutes from './routes/closed-loop.routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Logging middleware
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/icps', icpRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/content-ideas', contentIdeasRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/sales', salesMachineRoutes);
app.use('/api/v1/intelligence', intelligenceRoutes);
app.use('/api/v1/intelligence-engine', intelligenceEngineRoutes);
app.use('/api/v1/closed-loop', closedLoopRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Growth Operator API',
    version: '1.0.0',
    status: 'running',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
