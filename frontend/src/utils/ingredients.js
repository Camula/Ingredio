export function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function toIngredient(item) {
  if (typeof item === "string") {
    return {
      name: item,
      quantity: "",
      unit: ""
    };
  }

  return {
    name: item?.name || "",
    quantity: item?.quantity || "",
    unit: item?.unit || ""
  };
}

export function ingredientKey(item) {
  return normalizeText(toIngredient(item).name);
}

export function ingredientDisplay(item) {
  const ingredient = toIngredient(item);
  const parts = [ingredient.name];

  if (ingredient.quantity) {
    parts.push(ingredient.quantity);
  }

  if (ingredient.unit) {
    parts.push(ingredient.unit);
  }

  return parts.filter(Boolean).join(" ").trim();
}

// ---- LOGIKA ROZPOZNAWANIA BRAKÓW W LODÓWCE ----

const IGNORED_MISSING_TERMS = [
  "sól", "pieprz", "woda", "olej", "oliwa", "masło", "cukier", 
  "bazylia", "oregano", "tymianek", "rozmaryn", "papryka", 
  "przyprawa", "przyprawy", "czosnek granulowany", 
  "cebula granulowana", "bulion", "kostka rosołowa"
];

function stripDiacritics(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeLoose(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemToken(token) {
  const suffixes = [
    "owego", "owej", "owych", "ami", "owi", "ach", "ego", "emu",
    "owie", "owy", "owa", "owe", "ów", "ow", "om", "em", "ie",
    "y", "i", "e", "a", "u", "ą", "ę"
  ];

  let result = token;
  for (const suffix of suffixes) {
    if (result.length > 4 && result.endsWith(suffix)) {
      result = result.slice(0, -suffix.length);
      break;
    }
  }
  return result;
}

export function normalizeIngredientName(value) {
  return normalizeLoose(value)
    .split(" ")
    .filter(Boolean)
    .map(stemToken)
    .join(" ");
}

export function isIgnoredMissingItem(item) {
  const normalized = normalizeLoose(typeof item === "string" ? item : ingredientDisplay(item));
  return IGNORED_MISSING_TERMS.some((term) => normalized.includes(normalizeLoose(term)));
}

export function isMissingIngredient(item, fridgeIngredients) {
  if (isIgnoredMissingItem(item)) {
    return false;
  }

  const itemNorm = normalizeIngredientName(typeof item === "string" ? item : ingredientDisplay(item));
  if (!itemNorm) return false;

  const found = fridgeIngredients.some((fItem) => {
    const fNorm = normalizeIngredientName(ingredientDisplay(fItem));
    if (!fNorm) return false;
    return fNorm === itemNorm || fNorm.includes(itemNorm) || itemNorm.includes(fNorm);
  });

  return !found;
}

export function getMissingIngredients(recipeIngredients, fridgeIngredients) {
  const missing = [];
  for (const item of (recipeIngredients || [])) {
    if (isMissingIngredient(item, fridgeIngredients)) {
      missing.push(item);
    }
  }
  return missing;
}