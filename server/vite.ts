import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  createServer as createViteServer,
  createLogger as viteCreateLogger,
} from 'vite';
import { type Server } from 'http';
import viteConfig from '../vite.config';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const viteLogger = viteCreateLogger();

export function log(message: string, source = 'express') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg: string, options: any) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: 'custom',
  });

  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        '..',
        'client',
        'index.html',
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, 'dist/public');

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.use('*', async (req, res, next) => {
    try {
      const manifest = JSON.parse(
        await fs.promises.readFile(
          path.resolve(distPath, 'manifest.json'),
          'utf-8',
        ),
      );

      const productionTags = generateProductionTags(manifest, 'src/main.tsx');
      const template = await fs.promises.readFile(
        path.resolve(distPath, 'index.html'),
        'utf-8',
      );
      const page = template.replace('%PRODUCTION_TAGS%', productionTags);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      next(e);
    }
  });
}

function generateProductionTags(
  manifest: Record<string, any>,
  entry: string,
): string {
  const tags: string[] = [];
  const entryChunk = manifest[entry];

  if (entryChunk) {
    if (entryChunk.css) {
      entryChunk.css.forEach((cssFile: string) => {
        tags.push(`<link rel="stylesheet" href="/${cssFile}" />`);
      });
    }

    tags.push(`<script type="module" src="/${entryChunk.file}"></script>`);

    if (entryChunk.imports) {
      entryChunk.imports.forEach((imported: string) => {
        const importedChunk = manifest[imported];
        if (importedChunk) {
          tags.push(
            `<link rel="modulepreload" href="/${importedChunk.file}" />`,
          );
        }
      });
    }
  }

  return tags.join('\n');
}
