import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { UserRegisterSchema, UserLoginSchema, authMiddleware } from '@ingredio/shared';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: User registered }
 */
router.post('/register', async (req, res) => {
  try {
    const validatedData = UserRegisterSchema.parse(req.body);
    
    // Sprawdzenie czy użytkownik już istnieje
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Użytkownik o tym adresie email już istnieje' });
    }

    const user = new User(validatedData);
    await user.save();

    res.status(201).json({ message: 'Użytkownik zarejestrowany pomyślnie' });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0].message });
    }
    res.status(500).json({ error: 'Błąd serwera podczas rejestracji' });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 */
router.post('/login', async (req, res) => {
  try {
    const validatedData = UserLoginSchema.parse(req.body);
    
    // Weryfikacja poświadczeń
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }

    const isMatch = await (user as any).comparePassword(validatedData.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, message: 'Zalogowano pomyślnie' });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0].message });
    }
    res.status(500).json({ error: 'Błąd serwera podczas logowania' });
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profile]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User profile }
 */
router.get('/me', authMiddleware(JWT_SECRET), async (req: any, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   patch:
 *     summary: Update profile or settings
 *     tags: [Profile]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               settings: { type: object }
 *     responses:
 *       200: { description: Updated }
 */
router.patch('/me', authMiddleware(JWT_SECRET), async (req: any, res) => {
  try {
    const { name, settings } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });

    // Aktualizacja pól profilu i ustawień użytkownika
    if (name) user.name = name;
    if (settings) {
      if (settings.notifications) user.settings.notifications = { ...user.settings.notifications, ...settings.notifications };
      if (settings.privacy) user.settings.privacy = { ...user.settings.privacy, ...settings.privacy };
    }

    await user.save();
    res.json({ message: 'Profil zaktualizowany', user });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password changed }
 */
router.post('/change-password', authMiddleware(JWT_SECRET), async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Wymagane oba hasła' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });

    // Rzeczywista weryfikacja starego hasła przed zmianą
    const isMatch = await (user as any).comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Aktualne hasło jest nieprawidłowe' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Hasło zostało zmienione' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
