import { useState, useMemo } from "react";
import { API_RECIPE, RECIPE_CATEGORY_GROUPS } from "../constants";
import { normalizeText, toIngredient } from "../utils/ingredients";

const createInitialCategoryState = () =>
  Object.fromEntries(RECIPE_CATEGORY_GROUPS.map((group) => [group.title, null]));

export function useRecipes(token, showMessage) {
  const [allowExtra, setAllowExtra] = useState(true);
  const [selectedCategoryByGroup, setSelectedCategoryByGroup] = useState(createInitialCategoryState);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [historyRecipes, setHistoryRecipes] = useState([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const selectedCategories = useMemo(
    () => Object.values(selectedCategoryByGroup).filter(Boolean),
    [selectedCategoryByGroup]
  );

  const selectCategoryForGroup = (groupTitle, category) => {
    setSelectedCategoryByGroup((prev) => ({
      ...prev,
      [groupTitle]: category === "Dowolna" ? null : category
    }));
  };

  const resetCategories = () => setSelectedCategoryByGroup(createInitialCategoryState());

  const recipeSignature = (recipe) => {
    if (!recipe) return "";
    const title = normalizeText(recipe.title || "");
    const ingredientsPart = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map((item) => normalizeText(typeof item === "string" ? item : item?.name || item?.title || "")).join("|")
      : "";
    const stepsPart = Array.isArray(recipe.steps) ? recipe.steps.map((step) => normalizeText(step)).join("|") : "";
    const categoriesPart = Array.isArray(recipe.categories) ? recipe.categories.map((item) => normalizeText(item)).join("|") : "";
    return `${title}__${ingredientsPart}__${stepsPart}__${categoriesPart}`;
  };

  const addRecipesToHistory = (items) => {
    const incoming = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!incoming.length) return;

    setHistoryRecipes((prev) => {
      const combined = [...incoming, ...prev];
      const seen = new Set();
      const next = [];
      for (const recipe of combined) {
        const signature = recipeSignature(recipe);
        if (!signature || seen.has(signature)) continue;
        seen.add(signature);
        next.push(recipe);
        if (next.length >= 5) break;
      }
      return next;
    });
  };

  const generateRecipes = async (items, mainIngredientKey, setTab) => {
    const payloadItems = (items || []).map(toIngredient).filter((item) => normalizeText(item.name));
    if (!payloadItems.length) return showMessage("Brak składników"), false;

    setLoadingRecipe(true);
    try {
      const res = await fetch(`${API_RECIPE}/recipe/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ingredients: payloadItems,
          preferences: { allowExtra, categories: selectedCategories, mainIngredient: mainIngredientKey }
        })
      });
      const data = await res.json();
      if (!res.ok) return showMessage(data.detail || "Błąd generowania"), false;
      if (!Array.isArray(data) || data.length < 2) return showMessage("Nieprawidłowa odpowiedź przepisu"), false;

      const nextRecipes = data.slice(0, 2);
      addRecipesToHistory(recipes);
      setSelectedRecipe(null);
      setRecipes(nextRecipes);
      setTab("generate");
      showMessage("Wygenerowano");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    } finally {
      setLoadingRecipe(false);
    }
  };

  const chooseGeneratedRecipe = (index) => {
    const chosen = recipes[index];
    if (!chosen) return;
    const discarded = recipes.filter((_, recipeIndex) => recipeIndex !== index);
    setSelectedRecipe(chosen);
    addRecipesToHistory(discarded);
  };

  const clearRecipesState = () => {
    setSelectedCategoryByGroup(createInitialCategoryState());
    setRecipes([]);
    setSelectedRecipe(null);
    setHistoryRecipes([]);
  };

  return {
    allowExtra, setAllowExtra, selectedCategoryByGroup, recipes, selectedRecipe, historyRecipes,
    loadingRecipe, selectCategoryForGroup, resetCategories, generateRecipes, chooseGeneratedRecipe, clearRecipesState
  };
}