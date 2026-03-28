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