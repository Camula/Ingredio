import { z } from 'zod';

export const AddIngredientSchema = z.object({
  name: z.string().min(2).max(50),
  amount: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
});

export const VoiceIngredientsSchema = z.object({
  ingredients: z.array(AddIngredientSchema),
});

export const UpdateIngredientSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  amount: z.number().positive().optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
});

export type AddIngredientInput = z.infer<typeof AddIngredientSchema>;
export type VoiceIngredientsInput = z.infer<typeof VoiceIngredientsSchema>;
export type UpdateIngredientInput = z.infer<typeof UpdateIngredientSchema>;
