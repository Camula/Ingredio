import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import dotenv from 'dotenv';
import { RecipeSchema, VoiceIngredientsSchema } from '@ingredio/shared';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey || apiKey === 'your_openai_api_key_here') {
  console.error('BŁĄD KRYTYCZNY: Brak klucza OPENAI_API_KEY w zmiennych środowiskowych.');
  console.error('Upewnij się, że plik .env zawiera poprawny klucz API OpenAI.');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

const PANTRY_STAPLES = [
  'sól', 'pieprz', 'woda', 'oliwa', 'olej', 'cukier', 'mąka', 'masło', 
  'ocet', 'sok z cytryny', 'oregano', 'bazylia', 'papryka słodka', 'papryka ostra'
];

/**
 * Generuje przepis na podstawie listy składników użytkownika.
 */
export const generateRecipeFromIngredients = async (
  ingredients: string[], 
  unselectedIngredients: string[] = [],
  smartSupplement: boolean = false,
  filters?: any
) => {
  try {
    const systemPrompt = `
      Jesteś profesjonalnym szefem kuchni. Twoim zadaniem jest stworzenie kreatywnego przepisu na podstawie składników dostarczonych przez użytkownika oraz nałożonych filtrów.

      ZASADY DOTYCZĄCE SKŁADNIKÓW:
      1. WYBRANE SKŁADNIKI: To Twoja baza. MUSISZ użyć ich jako głównych elementów potrawy. Oznacz je jako 'isOwned: true' i 'isStaple: false'.
      2. INNE SKŁADNIKI Z LODÓWKI: Możesz ich użyć TYLKO jeśli lista 'unselectedIngredients' nie jest pusta. Jeśli ta lista jest pusta, KATEGORYCZNIE NIE MOŻESZ dodawać żadnych innych produktów z lodówki użytkownika poza tymi wybranymi.
      3. PRZYPRAWY I DODATKI (Staples): Przyjmij, że użytkownik posiada WYŁĄCZNIE te produkty: ${PANTRY_STAPLES.join(', ')}. Każda inna przyprawa spoza tej listy musi być traktowana jako 'smartSupplement'.
      4. SMART SUPPLEMENT: Jeśli flaga 'smartSupplement' jest TAK, możesz dodać MAX 3 dodatkowe składniki ze sklepu. Oznacz je jako 'isOwned: false' i 'isStaple: false'.
      5. RYGRORYSTYCZNE OGRANICZENIE: Jeśli flaga 'smartSupplement' jest NIE, KATEGORYCZNIE ZABRANIA SIĘ dodawania jakichkolwiek składników spoza punktów 1, 2 i 3. Nie dodawaj nawet natki pietruszki czy czosnku, jeśli nie ma ich na liście.

      ZASADY DOTYCZĄCE FILTRÓW:
      - Jeśli użytkownik określił filtr (wartość inna niż 'Dowolny'/'Dowolna'), MUSISZ się go bezwzględnie trzymać.
      - DIETA: Jeśli wybrano konkretną dietę (np. Wegetariańska), nie używaj składników z nią niezgodnych (mięso), nawet jeśli są w lodówce.
      - CZAS: Dopasuj stopień skomplikowania potrawy do wybranego czasu.

      ZASADY DOTYCZĄCE JEDNOSTEK:
      - ZAWSZE podawaj jednostkę w polu 'unit' (np. 'g', 'ml', 'szt.', 'łyżka', 'łyżeczka', 'szczypta', 'opakowanie').
      - Pole 'amount' powinno zawierać TYLKO liczbę lub ułamek (np. '1', '250', '1/2'). NIE WPISUJ jednostek w polu 'amount'.

      WYMAGANIA DOTYCZĄCE ODPOWIEDZI:
      - Przepis musi być napisany w języku polskim.
      - Tytuł powinien być zachęcający.
      - Instrukcje muszą być jasne i podzielone na kroki.
    `;
    const filtersPrompt = filters ? `
      WYMAGANIA DODATKOWE (FILTRY):
      - Czas gotowania: ${filters.time}
      - Poziom trudności: ${filters.difficulty}
      - Dieta: ${filters.diet}
      - Typ kuchni: ${filters.cuisine}
      - Typ posiłku: ${filters.mealType}
    ` : '';

    const userPrompt = `
      WYBRANE SKŁADNIKI: ${ingredients.join(', ')}
      INNE SKŁADNIKI Z LODÓWKI: ${unselectedIngredients.length > 0 ? unselectedIngredients.join(', ') : 'brak'}
      Zgoda na dodatkowe składniki ze sklepu (Smart Supplement): ${smartSupplement ? 'TAK' : 'NIE'}
      ${filtersPrompt}
    `;


    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(RecipeSchema.omit({ createdAt: true, id: true }), 'recipe'),
    });

    const recipe = completion.choices[0].message.parsed;

    if (!recipe) {
      throw new Error('AI nie zwróciło poprawnego przepisu.');
    }

    return recipe;
  } catch (error: any) {
    if (error.message === 'AI nie zwróciło poprawnego przepisu.') {
      throw error;
    }
    console.error('Błąd OpenAI:', error);
    if (error.name === 'ZodError') {
      throw new Error('Odpowiedź AI jest niezgodna ze schematem danych.');
    }
    throw new Error('Wystąpił błąd podczas komunikacji z serwisem AI.');
  }
};

export default openai;

/**
 * Transkrybuje bufor audio na tekst za pomocą Whisper.
 */
export const transcribeAudio = async (buffer: Buffer) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: await OpenAI.toFile(buffer, 'voice.webm'),
      model: 'whisper-1',
      language: 'pl',
    });
    return transcription.text;
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error('Błąd podczas transkrypcji dźwięku.');
  }
};

/**
 * Parsuje tekst na listę składników za pomocą GPT.
 */
export const parseVoiceIngredients = async (text: string) => {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'Jesteś asystentem kuchennym. Twoim zadaniem jest wyodrębnienie listy składników z tekstu. ' +
                   'Dla każdego składnika podaj nazwę, ilość (jako liczba) i jednostkę (np. g, ml, szt, kg, łyżka). ' +
                   'Jeśli ilość lub jednostka nie są podane, pomiń te pola.'
        },
        { role: 'user', content: `Wyodrębnij składniki z tego tekstu: "${text}"` },
      ],
      response_format: zodResponseFormat(VoiceIngredientsSchema, 'voice_ingredients'),
    });

    return completion.choices[0].message.parsed?.ingredients || [];
  } catch (error) {
    console.error('GPT voice parsing error:', error);
    throw new Error('Błąd podczas interpretacji składników.');
  }
};
