import { z } from 'zod';

/**
 * Schemat pojedynczego składnika w przepisie
 */
export const IngredientSchema = z.object({
  name: z.string().min(1, 'Nazwa składnika jest wymagana'),
  amount: z.string().optional(),
  unit: z.string().optional(),
  isOwned: z.boolean().default(true),
  isStaple: z.boolean().default(false),
});

/**
 * Schemat przepisu generowanego przez AI lub zapisanego przez użytkownika
 */
export const RecipeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Tytuł przepisu jest wymagany'),
  ingredients: z.array(IngredientSchema).min(1, 'Przepis musi zawierać przynajmniej jeden składnik'),
  instructions: z.array(z.string()).min(1, 'Przepis musi zawierać instrukcje'),
  prepTimeMinutes: z.number().nonnegative().optional(),
  createdAt: z.coerce.date().optional(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
