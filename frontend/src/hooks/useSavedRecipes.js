import { useState } from "react";
import { API_RECIPE } from "../constants";

export function useSavedRecipes(token, showMessage) {
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [expandedSavedId, setExpandedSavedId] = useState(null);

  const loadSavedRecipes = async (customToken) => {
    try {
      const res = await fetch(`${API_RECIPE}/recipe/saved`, {
        headers: { Authorization: `Bearer ${customToken || token}` }
      });
      const data = await res.json();
      setSavedRecipes(Array.isArray(data) ? data : []);
    } catch {
      setSavedRecipes([]);
    }
  };

  const saveRecipe = async (recipe) => {
    try {
      const res = await fetch(`${API_RECIPE}/recipe/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe })
      });
      const data = await res.json();
      if (!res.ok) return showMessage(data.detail || "Błąd zapisu"), false;

      await loadSavedRecipes();
      showMessage("Zapisano przepis");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const deleteSavedRecipe = async (id) => {
    try {
      const res = await fetch(`${API_RECIPE}/recipe/saved/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) return showMessage(data.detail || "Błąd usuwania"), false;

      await loadSavedRecipes();
      showMessage("Usunięto przepis");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const clearSavedState = () => {
    setSavedRecipes([]);
    setExpandedSavedId(null);
  };

  return {
    savedRecipes, expandedSavedId, setExpandedSavedId,
    loadSavedRecipes, saveRecipe, deleteSavedRecipe, clearSavedState
  };
}