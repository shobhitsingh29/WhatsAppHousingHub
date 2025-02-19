import fs from 'fs';
import path from 'path';

function generateProductionTags(manifest) {
  console.log('Generating production tags from manifest:', JSON.stringify(manifest, null, 2));
  const tags = [];
  const entryChunk = manifest['src/main.tsx'];

  if (!entryChunk) {
    throw new Error('Could not find entry chunk in manifest');
  }

  console.log('Processing entry chunk:', entryChunk);

  if (entryChunk.css) {
    entryChunk.css.forEach((cssFile) => {
      console.log('Adding CSS tag for:', cssFile);
      tags.push(`<link rel="stylesheet" href="/${cssFile}" />`);
    });
  }

  console.log('Adding script tag for:', entryChunk.file);
  tags.push(`<script type="module" src="/${entryChunk.file}"></script>`);

  if (entryChunk.imports) {
    entryChunk.imports.forEach((imported) => {
      const importedChunk = manifest[imported];
      if (importedChunk) {
        console.log('Adding modulepreload for:', importedChunk.file);
        tags.push(`<link rel="modulepreload" href="/${importedChunk.file}" />`);
      }
    });
  }

  const finalTags = tags.join('\n');
  console.log('Generated production tags:', finalTags);
  return finalTags;
}

try {
  console.log('Starting post-build processing...');

  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    console.log('Creating dist directory...');
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Read and process the manifest
  console.log('Reading manifest...');
  const manifestPath = path.join(distDir, '.vite', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Read the template HTML
  console.log('Reading template...');
  const templatePath = path.join('client', 'index.html');
  let template = fs.readFileSync(templatePath, 'utf-8');

  // Replace the script tag placeholder with production tags
  console.log('Generating production tags...');
  const productionTags = generateProductionTags(manifest);
  template = template.replace('<script type="module" src="/src/main.tsx"></script>', productionTags);

  // Write the processed index.html
  console.log('Writing processed index.html...');
  fs.writeFileSync(path.join(distDir, 'index.html'), template);

  // Copy the manifest to the root of dist
  console.log('Copying manifest...');
  fs.copyFileSync(manifestPath, path.join(distDir, 'manifest.json'));

  // Copy assets folder to the root of dist
  if (fs.existsSync(path.join(distDir, 'assets'))) {
    console.log('Assets directory already exists in dist...');
  } else {
    console.log('Creating assets directory in dist...');
    fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
  }

  // Copy all assets to dist/assets
  const srcAssetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(srcAssetsDir)) {
    fs.readdirSync(srcAssetsDir).forEach((file) => {
      if (!file.startsWith('.')) { // Skip hidden files
        console.log(`Processing asset: ${file}`);
        const srcPath = path.join(srcAssetsDir, file);
        const destPath = path.join(distDir, 'assets', file);
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  console.log('Post-build processing completed successfully');

  // Verify the processed file
  const processedContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  if (processedContent.includes('<script type="module" src="/src/main.tsx"></script>')) {
    throw new Error('Template placeholder still present after processing');
  }

  console.log('Final verification passed - template properly processed');
} catch (error) {
  console.error('Post-build processing failed:', error);
  console.error('Error details:', error.stack);
  process.exit(1);
}