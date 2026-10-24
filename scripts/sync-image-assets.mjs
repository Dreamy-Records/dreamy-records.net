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

// src/assetsにだけ置かれた画像は、削除前にpublic/assetsへ移して消えないようにする
const rescueImages = async (source, destination) => {
  let entries;
  try {
    entries = await fs.readdir(source, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await rescueImages(sourcePath, destinationPath);
    } else if (imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      try {
        await fs.access(destinationPath);
      } catch {
        await fs.mkdir(destination, { recursive: true });
        await fs.copyFile(sourcePath, destinationPath);
        console.warn(
          `[sync:images] ${path.relative(projectRoot, sourcePath)} を ${path.relative(projectRoot, destinationPath)} へ移しました。画像はpublic/assetsに置いてください。`,
        );
      }
    }
  }
};

await rescueImages(destinationDirectory, sourceDirectory);
await fs.rm(destinationDirectory, { recursive: true, force: true });
await fs.mkdir(destinationDirectory, { recursive: true });
await copyImages(sourceDirectory, destinationDirectory);
