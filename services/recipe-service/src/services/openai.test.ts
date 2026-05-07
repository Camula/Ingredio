import { describe, it, expect, vi } from 'vitest';
import { generateRecipeFromIngredients } from './openai';

// Mock OpenAI rygorystycznie zgodnie z wymaganiami klas
vi.mock('openai', () => {
  return {
    default: class {
      beta = {
        chat: {
          completions: {
            parse: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  parsed: {
                    title: 'Testowy Przepis',
                    ingredients: [
                      { name: 'Pomidor', amount: '2', unit: 'szt.', isOwned: true, isStaple: false }
                    ],
                    instructions: ['Krok 1', 'Krok 2'],
                    prepTimeMinutes: 15,
                    difficulty: 'Łatwy'
                  }
                }
              }]
            })
          }
        }
      };
    },
    zodResponseFormat: vi.fn()
  };
});

describe('OpenAI Service - Recipe Generation', () => {
  it('should generate a valid recipe structure', async () => {
    // Ustawiamy dummy API KEY dla testu, aby uniknąć logów błędu
    process.env.OPENAI_API_KEY = 'test-key';
    
    const ingredients = ['pomidor', 'cebula'];
    const recipe = await generateRecipeFromIngredients(ingredients);
    
    expect(recipe).toHaveProperty('title');
    expect(recipe.title).toBe('Testowy Przepis');
    expect(recipe.ingredients).toBeInstanceOf(Array);
    expect(recipe.instructions.length).toBeGreaterThan(0);
  });
});
