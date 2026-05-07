import Fuse from 'fuse.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ingredientsPath = path.join(__dirname, '../../data/ingredients.json');
const ingredientsData = JSON.parse(fs.readFileSync(ingredientsPath, 'utf-8'));

const fuse = new Fuse(ingredientsData, {
  keys: ['name'],
  threshold: 0.3,
});

/**
 * Wyszukuje składniki pasujące do zapytania.
 * @param query Szukana fraza.
 * @returns 10 najlepiej pasujących składników.
 */
export const searchIngredients = (query: string) => {
  if (!query) return [];
  return fuse.search(query).slice(0, 10).map(result => result.item);
};
