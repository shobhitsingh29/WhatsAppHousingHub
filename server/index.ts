import fs from 'fs';
import express, { type Request, Response, NextFunction } from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import cors from 'cors';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Make fs available globally for vite.ts
globalThis.fs = fs;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS based on environment
const isProduction = process.env.NODE_ENV === "production";
const corsOptions = {
  origin: isProduction
    ? [process.env.FRONTEND_URL || 'https://your-frontend-domain.vercel.app']
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

    // Add details about the response type
    const contentType = res.get('Content-Type');
    logLine += ` [${contentType || 'no content-type'}]`;

    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + '…';
    }

    log(logLine);
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  if (isProduction) {
    // API routes only in production
    app.use('/api', (req, res, next) => {
      log(`Processing API request: ${req.method} ${req.path}`);
      req.url = req.url.replace(/^\/api/, '');
      next();
    });
  } else {
    await setupVite(app, server);
  }

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ 
      error: true,
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    log(`Server running in ${isProduction ? 'production' : 'development'} mode on port ${PORT}`);
  });
})().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});