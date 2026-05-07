import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { Recipe } from '../models/Recipe.js';
import { RecipeSchema } from '@ingredio/shared';
import { generateRecipeFromIngredients, transcribeAudio, parseVoiceIngredients } from '../services/openai.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Limiter dla endpointu generowania przepisu (ochrona zasobów AI)
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Zbyt wiele próśb o wygenerowanie przepisu. Spróbuj ponownie później.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @openapi
 * components:
 *   schemas:
 *     RecipeIngredient:
 *       type: object
 *       properties:
 *         name: { type: string }
 *         amount: { type: string }
 *         unit: { type: string }
 *         isOwned: { type: boolean }
 *         isStaple: { type: boolean }
 *     Recipe:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         title: { type: string }
 *         ingredients:
 *           type: array
 *           items: { $ref: '#/components/schemas/RecipeIngredient' }
 *         instructions:
 *           type: array
 *           items: { type: string }
 *         prepTimeMinutes: { type: number }
 *         difficulty: { type: string, enum: [Łatwy, Średni, Trudny] }
 */

/**
 * @openapi
 * /api/recipes/generate:
 *   post:
 *     summary: Generate a new recipe using AI
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: 
 *             type: object
 *             required: [ingredients]
 *             properties:
 *               ingredients: { type: array, items: { type: string } }
 *               unselectedIngredients: { type: array, items: { type: string } }
 *               smartSupplement: { type: boolean }
 *               filters: { type: object }
 *     responses:
 *       200:
 *         description: Generated recipe
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Recipe' }
 */
router.post('/generate', generateLimiter, async (req: any, res) => {
  try {
    const { ingredients, unselectedIngredients, smartSupplement, filters } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: 'Lista składników jest wymagana.' });
    }
    const recipe = await generateRecipeFromIngredients(ingredients, unselectedIngredients || [], !!smartSupplement, filters);
    res.json(recipe);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Błąd podczas generowania przepisu.' });
  }
});

/**
 * @openapi
 * /api/recipes/favorites:
 *   get:
 *     summary: Get user favorite recipes
 *     tags: [Favorites]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Recipe' }
 */
router.get('/favorites', async (req: any, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

/**
 * @openapi
 * /api/recipes/favorites:
 *   post:
 *     summary: Save recipe to favorites
 *     tags: [Favorites]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Recipe' }
 *     responses:
 *       201: { description: Recipe saved }
 */
router.post('/favorites', async (req: any, res) => {
  try {
    const validatedData = RecipeSchema.parse(req.body);
    const newRecipe = new Recipe({ ...validatedData, userId: req.user.userId });
    await newRecipe.save();
    res.status(201).json(newRecipe);
  } catch (error: any) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

/**
 * @openapi
 * /api/recipes/favorites/{id}:
 *   delete:
 *     summary: Remove recipe from favorites
 *     tags: [Favorites]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Removed }
 */
router.delete('/favorites/:id', async (req: any, res) => {
  try {
    const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!recipe) return res.status(404).json({ message: 'Nie znaleziono przepisu' });
    res.json({ message: 'Usunięto przepis z ulubionych' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

/**
 * @openapi
 * /api/recipes/voice-parse:
 *   post:
 *     summary: Parse voice to ingredients (Whisper + GPT)
 *     tags: [Voice]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Voice analysis result
 */
router.post('/voice-parse', upload.single('audio'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: 'Brak pliku audio.' });
  try {
    const transcription = await transcribeAudio(req.file.buffer);
    const ingredients = await parseVoiceIngredients(transcription);
    res.json({ ingredients, transcription });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Błąd przetwarzania mowy.' });
  }
});

export default router;
