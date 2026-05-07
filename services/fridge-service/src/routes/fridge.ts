import express from 'express';
import { FridgeItem } from '../models/FridgeItem.js';

const router = express.Router();

/**
 * @openapi
 * /api/fridge:
 *   get:
 *     summary: Get all items in user's fridge
 *     tags: [Fridge]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of items }
 */
router.get('/', async (req: any, res) => {
  try {
    const items = await FridgeItem.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

/**
 * @openapi
 * /api/fridge:
 *   post:
 *     summary: Add a new item to the fridge
 *     tags: [Fridge]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               amount: { type: number }
 *               unit: { type: string }
 *     responses:
 *       201: { description: Item added }
 */
router.post('/', async (req: any, res) => {
  try {
    const { name, amount, unit } = req.body;
    const newItem = new FridgeItem({
      userId: req.user.userId,
      name,
      amount,
      unit
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

/**
 * @openapi
 * /api/fridge/batch:
 *   post:
 *     summary: Add multiple items at once
 *     tags: [Fridge]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     amount: { type: number }
 *                     unit: { type: string }
 *     responses:
 *       201: { description: Items added }
 */
router.post('/batch', async (req: any, res) => {
  try {
    const { ingredients } = req.body;
    const items = ingredients.map((ing: any) => ({
      ...ing,
      userId: req.user.userId
    }));
    await FridgeItem.insertMany(items);
    res.status(201).json({ message: 'Składniki dodane pomyślnie' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

/**
 * @openapi
 * /api/fridge/{id}:
 *   patch:
 *     summary: Update an item in the fridge
 *     tags: [Fridge]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               amount: { type: number }
 *               unit: { type: string }
 *     responses:
 *       200: { description: Item updated }
 */
router.patch('/:id', async (req: any, res) => {
  try {
    const item = await FridgeItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Produkt nie znaleziony' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

/**
 * @openapi
 * /api/fridge/{id}:
 *   delete:
 *     summary: Remove an item from the fridge
 *     tags: [Fridge]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Item removed }
 */
router.delete('/:id', async (req: any, res) => {
  try {
    const item = await FridgeItem.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!item) return res.status(404).json({ error: 'Produkt nie znaleziony' });
    res.json({ message: 'Produkt usunięty' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

/**
 * @openapi
 * /api/fridge/search:
 *   get:
 *     summary: Search for ingredient suggestions
 *     tags: [Fridge]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200: { description: Suggestions list }
 */
router.get('/search', async (req, res) => {
  // Symulacja podpowiedzi, docelowo z bazy ogólnych składników
  const query = (req.query.q as string || '').toLowerCase();
  const commonIngredients = ['pomidor', 'jajka', 'mleko', 'kurczak', 'cebula', 'czosnek', 'makaron', 'ryż', 'ziemniaki'];
  const results = commonIngredients.filter(i => i.includes(query));
  res.json(results);
});

export default router;
