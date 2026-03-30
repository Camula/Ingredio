import { useState, useMemo } from "react";
import { API_FRIDGE } from "../constants";
import { ingredientKey, normalizeText, toIngredient } from "../utils/ingredients";

export function useFridge(token, showMessage) {
  const [ingredients, setIngredients] = useState([]);
  const [selectedForRecipe, setSelectedForRecipe] = useState([]);
  const [mainIngredientKey, setMainIngredientKey] = useState("");

  const selectedIngredient = useMemo(() => {
    if (selectedForRecipe.length === 1) {
      return ingredients.find((item) => ingredientKey(item) === selectedForRecipe[0]) || null;
    }
    return null;
  }, [ingredients, selectedForRecipe]);

  const selectedIngredients = useMemo(() => {
    const set = new Set(selectedForRecipe);
    return ingredients.filter((item) => set.has(ingredientKey(item)));
  }, [ingredients, selectedForRecipe]);

  const refreshIngredients = async (customToken) => {
    try {
      const res = await fetch(`${API_FRIDGE}/ingredients`, {
        headers: { Authorization: `Bearer ${customToken || token}` }
      });
      const data = await res.json();

      if (!Array.isArray(data)) {
        setIngredients([]);
        setSelectedForRecipe([]);
        return;
      }

      const normalized = data.map(toIngredient);
      setIngredients(normalized);
      const keys = normalized.map((item) => ingredientKey(item)).filter(Boolean);

      setSelectedForRecipe((prev) => {
        const filtered = prev.filter((key) => keys.includes(key));
        return filtered.length ? filtered : keys;
      });

      if (mainIngredientKey && !normalized.some((item) => ingredientKey(item) === mainIngredientKey)) {
        setMainIngredientKey("");
      }
    } catch {
      setIngredients([]);
      setSelectedForRecipe([]);
    }
  };

  const addIngredient = async ({ name, quantity, unit }) => {
    const normalizedName = name.trim();
    if (!normalizedName) return showMessage("Pusty składnik"), false;

    if (ingredients.some((item) => ingredientKey(item) === normalizeText(normalizedName))) {
      return showMessage("Składnik już istnieje"), false;
    }

    try {
      const res = await fetch(`${API_FRIDGE}/ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: normalizedName, quantity: quantity.trim(), unit: unit.trim() })
      });
      const data = await res.json();
      if (!res.ok) return showMessage(data.detail || "Błąd dodawania"), false;

      await refreshIngredients();
      showMessage("Dodano składnik");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const updateSelectedIngredient = async (oldName, payload) => {
    const newName = payload.name.trim();
    if (!newName) return showMessage("Pusta nazwa"), false;

    try {
      const res = await fetch(`${API_FRIDGE}/ingredients/${encodeURIComponent(oldName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName, quantity: payload.quantity.trim(), unit: payload.unit.trim() })
      });
      const data = await res.json();
      if (!res.ok) return showMessage(data.detail || "Błąd edycji"), false;

      await refreshIngredients();
      showMessage("Zapisano zmiany");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const deleteSelectedIngredients = async () => {
    if (selectedForRecipe.length === 0) return false;

    try {
      await Promise.all(selectedForRecipe.map(key => {
        const item = ingredients.find(i => ingredientKey(i) === key);
        if (item) {
          return fetch(`${API_FRIDGE}/ingredients/${encodeURIComponent(item.name)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }));

      const removedKeys = new Set(selectedForRecipe);
      setSelectedForRecipe([]);
      if (removedKeys.has(mainIngredientKey)) setMainIngredientKey("");
      
      await refreshIngredients();
      showMessage("Usunięto wybrane składniki");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const clearFridge = async () => {
    try {
      const res = await fetch(`${API_FRIDGE}/ingredients`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) return showMessage(data.detail || "Błąd czyszczenia"), false;

      setSelectedForRecipe([]);
      setMainIngredientKey("");
      await refreshIngredients();
      showMessage("Wyczyszczono lodówkę");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const toggleIngredientForRecipe = (item) => {
    const key = ingredientKey(item);
    setSelectedForRecipe((prev) => {
      const next = prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key];
      if (!next.includes(mainIngredientKey)) setMainIngredientKey("");
      return next;
    });
  };

  const selectAllForRecipe = () => {
    setSelectedForRecipe(ingredients.map((item) => ingredientKey(item)).filter(Boolean));
  };

  const clearAllForRecipe = () => {
    setSelectedForRecipe([]);
    setMainIngredientKey("");
  };

  const clearFridgeState = () => {
    setIngredients([]);
    setSelectedForRecipe([]);
    setMainIngredientKey("");
  };

  return {
    ingredients, selectedForRecipe, mainIngredientKey, setMainIngredientKey, 
    selectedIngredient, selectedIngredients, refreshIngredients, addIngredient,
    updateSelectedIngredient, deleteSelectedIngredients, clearFridge, toggleIngredientForRecipe,
    selectAllForRecipe, clearAllForRecipe, clearFridgeState
  };
}