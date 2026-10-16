import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

for (const folder of ['public/images/products', 'public/images/hero']) {
  for (const name of await readdir(folder)) {
    if (!name.endsWith('.png')) continue;
    const input = join(folder, name);
    const output = input.replace(/\.png$/, '.webp');
    await sharp(input).resize({ width: folder.endsWith('hero') ? 1600 : 900, withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toFile(output);
    console.log(output);
  }
}
