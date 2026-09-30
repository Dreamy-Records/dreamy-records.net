import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const sourceDirectory = path.join(projectRoot, 'public/assets');
const destinationDirectory = path.join(projectRoot, 'src/assets');
const imageExtensions = new Set(['.avif', '.jpg', '.jpeg', '.png', '.webp']);

const copyImages = async (source, destination) => {
  const entries = await fs.readdir(source, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = path.join(source, entry.name);
      const destinationPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        await fs.mkdir(destinationPath, { recursive: true });
        await copyImages(sourcePath, destinationPath);
      } else if (imageExtensions.has(path.extname(entry.name).toLowerCase())) {
        await fs.copyFile(sourcePath, destinationPath);
      }
    }),
  );
};

await fs.rm(destinationDirectory, { recursive: true, force: true });
await fs.mkdir(destinationDirectory, { recursive: true });
await copyImages(sourceDirectory, destinationDirectory);
