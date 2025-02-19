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

  // Create dist/public directory if it doesn't exist
  const publicDir = path.resolve('dist/public');
  if (!fs.existsSync(publicDir)) {
    console.log('Creating dist/public directory...');
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy all files from dist to dist/public
  const distDir = path.resolve('dist');
  fs.readdirSync(distDir).forEach((file) => {
    if (file !== 'public') {
      const srcPath = path.join(distDir, file);
      const destPath = path.join(publicDir, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to public directory`);
    }
  });

  const manifestPath = path.join(publicDir, 'manifest.json');
  const indexPath = path.join(publicDir, 'index.html');

  console.log('Reading manifest from:', manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  console.log('Reading template from:', indexPath);
  let template = fs.readFileSync(indexPath, 'utf-8');

  if (!template.includes('%PRODUCTION_TAGS%')) {
    throw new Error('Template does not contain %PRODUCTION_TAGS% placeholder');
  }

  const productionTags = generateProductionTags(manifest);
  template = template.replace('%PRODUCTION_TAGS%', productionTags);

  console.log('Writing processed index.html to:', indexPath);
  fs.writeFileSync(indexPath, template);

  console.log('Post-build processing completed successfully');

  // Verify the processed file
  const processedContent = fs.readFileSync(indexPath, 'utf-8');
  if (processedContent.includes('%PRODUCTION_TAGS%')) {
    throw new Error('Template placeholder still present after processing');
  }

  console.log('Final verification passed - template properly processed');
} catch (error) {
  console.error('Post-build processing failed:', error);
  console.error('Error details:', error.stack);
  process.exit(1);
}