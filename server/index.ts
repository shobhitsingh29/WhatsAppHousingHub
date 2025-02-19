import express, { type Request, Response, NextFunction } from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

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

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const distPath = path.join(__dirname, "..", "dist", "public");

    // Serve static files
    app.use(express.static(distPath, {
      maxAge: '1y',
      etag: true
    }));

    // Handle client-side routing
    app.get("*", (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    await setupVite(app, server);
  }

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running in ${isProduction ? 'production' : 'development'} mode on port ${PORT}`);
  });
})().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});