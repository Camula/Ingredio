import { useMemo, useState } from "react";
import "./App.css";
import TabNav from "./components/TabNav";
import Dashboard from "./components/Dashboard";
import FridgeTab from "./components/FridgeTab";
import GenerateTab from "./components/GenerateTab";
import SavedTab from "./components/SavedTab";
import ShoppingTab from "./components/ShoppingTab";
import AccountTab from "./components/AccountTab";
import { API_AUTH, API_FRIDGE, API_RECIPE } from "./constants";
import { ingredientKey, normalizeText, toIngredient } from "./utils/ingredients";

export default function App() {
  const [tab, setTab] = useState("dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const [message, setMessage] = useState("");

  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredientKey, setSelectedIngredientKey] = useState("");
  const [selectedForRecipe, setSelectedForRecipe] = useState([]);

  const [allowExtra, setAllowExtra] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [recipes, setRecipes] = useState([]);
  const [expandedRecipeIndex, setExpandedRecipeIndex] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const [savedRecipes, setSavedRecipes] = useState([]);
  const [expandedSavedId, setExpandedSavedId] = useState(null);

  const showMessage = (text) => {
    setMessage(text);
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => setMessage(""), 2500);
  };

  const selectedIngredient = useMemo(
    () => ingredients.find((item) => ingredientKey(item) === selectedIngredientKey) || null,
    [ingredients, selectedIngredientKey]
  );

  const refreshIngredients = async (customToken) => {
    try {
      const res = await fetch(`${API_FRIDGE}/ingredients`, {
        headers: {
          Authorization: `Bearer ${customToken || token}`
        }
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

      if (selectedIngredientKey && !normalized.some((item) => ingredientKey(item) === selectedIngredientKey)) {
        setSelectedIngredientKey("");
      }
    } catch {
      setIngredients([]);
      setSelectedForRecipe([]);
    }
  };

  const loadSavedRecipes = async (customToken) => {
    try {
      const res = await fetch(`${API_RECIPE}/recipe/saved`, {
        headers: {
          Authorization: `Bearer ${customToken || token}`
        }
      });

      const data = await res.json();

      if (!Array.isArray(data)) {
        setSavedRecipes([]);
        return;
      }

      setSavedRecipes(data);
    } catch {
      setSavedRecipes([]);
    }
  };

  const register = async () => {
    try {
      const res = await fetch(`${API_AUTH}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        return showMessage(data.detail || "Błąd rejestracji");
      }

      showMessage("Zarejestrowano");
    } catch {
      showMessage("Błąd połączenia");
    }
  };

  const login = async () => {
    try {
      const res = await fetch(`${API_AUTH}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        return showMessage(data.detail || "Błędne dane");
      }

      if (!data.access_token) {
        return showMessage("Brak tokena");
      }

      setToken(data.access_token);
      setTab("dashboard");
      await refreshIngredients(data.access_token);
      await loadSavedRecipes(data.access_token);
      showMessage("Zalogowano");
    } catch {
      showMessage("Błąd połączenia");
    }
  };

  const logout = () => {
    setToken("");
    setIngredients([]);
    setSelectedIngredientKey("");
    setSelectedForRecipe([]);
    setRecipes([]);
    setSavedRecipes([]);
    setExpandedRecipeIndex(null);
    setExpandedSavedId(null);
    setTab("dashboard");
    showMessage("Wylogowano");
  };

  const addIngredient = async ({ name, quantity, unit }) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      showMessage("Pusty składnik");
      return false;
    }

    const duplicate = ingredients.some((item) => ingredientKey(item) === normalizeText(normalizedName));
    if (duplicate) {
      showMessage("Składnik już istnieje");
      return false;
    }

    try {
      const res = await fetch(`${API_FRIDGE}/ingredients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: normalizedName,
          quantity: quantity.trim(),
          unit: unit.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.detail || "Błąd dodawania");
        return false;
      }

      await refreshIngredients();
      showMessage("Dodano składnik");
      return true;
    } catch {
      showMessage("Błąd połączenia");
      return false;
    }
  };

  const updateSelectedIngredient = async (oldName, payload) => {
    const newName = payload.name.trim();
    if (!newName) {
      showMessage("Pusta nazwa");
      return false;
    }

    try {
      const res = await fetch(`${API_FRIDGE}/ingredients/${encodeURIComponent(oldName)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          quantity: payload.quantity.trim(),
          unit: payload.unit.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.detail || "Błąd edycji");
        return false;
      }

      setSelectedIngredientKey("");
      await refreshIngredients();
      showMessage("Zapisano zmiany");
      return true;
    } catch {
      showMessage("Błąd połączenia");
      return false;
    }
  };

  const deleteSelectedIngredient = async () => {
    if (!selectedIngredient) {
      return false;
    }

    try {
      const res = await fetch(`${API_FRIDGE}/ingredients/${encodeURIComponent(selectedIngredient.name)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.detail || "Błąd usuwania");
        return false;
      }

      setSelectedIngredientKey("");
      await refreshIngredients();
      showMessage("Usunięto składnik");
      return true;
    } catch {
      showMessage("Błąd połączenia");
      return false;
    }
  };

  const clearFridge = async () => {
    try {
      const res = await fetch(`${API_FRIDGE}/ingredients`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.detail || "Błąd czyszczenia");
        return false;
      }

      setSelectedIngredientKey("");
      setSelectedForRecipe([]);
      await refreshIngredients();
      showMessage("Wyczyszczono lodówkę");
      return true;
    } catch {
      showMessage("Błąd połączenia");
      return false;
    }
  };

  const toggleIngredientForRecipe = (item) => {
    const key = ingredientKey(item);
    setSelectedForRecipe((prev) =>
      prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key]
    );
  };

  const selectAllForRecipe = () => {
    setSelectedForRecipe(ingredients.map((item) => ingredientKey(item)).filter(Boolean));
  };

  const clearAllForRecipe = () => {
    setSelectedForRecipe([]);
  };

  const toggleCategory = (category, checked) => {
    if (category === "__allow_extra__") {
      setAllowExtra(checked);
      return;
    }

    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((item) => item !== category);
      }
      return [...prev, category];
    });
  };

  const resetCategories = () => {
    setSelectedCategories([]);
  };

  const generateRecipes = async (items) => {
    const payloadItems = (items || [])
      .map(toIngredient)
      .filter((item) => normalizeText(item.name));

    if (!payloadItems.length) {
      showMessage("Brak składników");
      return false;
    }

    setLoadingRecipe(true);

    try {
      const res = await fetch(`${API_RECIPE}/recipe/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ingredients: payloadItems,
          preferences: {
            allowExtra,
            categories: selectedCategories
          }
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.detail || "Błąd generowania");
        return false;
      }

      if (!Array.isArray(data)) {
        showMessage("Nieprawidłowa odpowiedź przepisu");
        return false;
      }

      setRecipes(data);
      setExpandedRecipeIndex(null);
      setTab("generate");
      showMessage("Wygenerowano 3 przepisy");
      return true;
    } catch {
      showMessage("Błąd połączenia");
      return false;
    } finally {
      setLoadingRecipe(false);
    }
  };

  const quickGenerate = async () => {
    await generateRecipes(ingredients);
  };

  const saveRecipe = async (recipe) => {
    try {
      const res = await fetch(`${API_RECIPE}/recipe/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipe
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.detail || "Błąd zapisu");
        return false;
      }

      await loadSavedRecipes();
      showMessage("Zapisano przepis");
      return true;
    } catch {
      showMessage("Błąd połączenia");
      return false;
    }
  };

  const deleteSavedRecipe = async (id) => {
    try {
      const res = await fetch(`${API_RECIPE}/recipe/saved/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.detail || "Błąd usuwania");
        return false;
      }

      await loadSavedRecipes();
      showMessage("Usunięto przepis");
      return true;
    } catch {
      showMessage("Błąd połączenia");
      return false;
    }
  };

  const openSavedTab = async () => {
    setTab("saved");
    await loadSavedRecipes();
  };

  const goGenerateTab = () => {
    setTab("generate");
  };

  const goFridgeTab = () => {
    setTab("fridge");
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">Ingredio</div>
        <div className="topbar-right">
          {token ? <span className="topbar-email">{email}</span> : null}
          {token ? <button onClick={logout}>Wyloguj</button> : null}
        </div>
      </div>

      {message ? <div className="message">{message}</div> : null}

      {!token ? (
        <div className="auth-shell">
          <div className="panel auth-panel">
            <h2>Logowanie</h2>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Hasło"
              type="password"
            />
            <div className="actions">
              <button onClick={register}>Rejestruj</button>
              <button onClick={login}>Zaloguj</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <TabNav tab={tab} onChange={setTab} />

          <div className="content">
            {tab === "dashboard" ? (
              <Dashboard
                ingredientCount={ingredients.length}
                selectedCount={selectedForRecipe.length}
                recipeCount={recipes.length}
                savedCount={savedRecipes.length}
                lastRecipeTitle={recipes[0]?.title}
                onQuickGenerate={quickGenerate}
                onGoGenerate={goGenerateTab}
                onGoFridge={goFridgeTab}
              />
            ) : null}

            {tab === "fridge" ? (
              <FridgeTab
                ingredients={ingredients}
                selectedIngredientKey={selectedIngredientKey}
                selectedForRecipe={selectedForRecipe}
                selectedIngredient={selectedIngredient}
                onSelectIngredientForActions={(item) => setSelectedIngredientKey(ingredientKey(item))}
                onToggleRecipeSelection={toggleIngredientForRecipe}
                onSelectAllForRecipe={selectAllForRecipe}
                onClearAllForRecipe={clearAllForRecipe}
                onAddIngredient={addIngredient}
                onUpdateSelectedIngredient={updateSelectedIngredient}
                onDeleteSelectedIngredient={deleteSelectedIngredient}
                onClearFridge={clearFridge}
              />
            ) : null}

            {tab === "generate" ? (
              <GenerateTab
                allowExtra={allowExtra}
                selectedCategories={selectedCategories}
                selectedForRecipeCount={selectedForRecipe.length}
                onToggleCategory={toggleCategory}
                onResetCategories={resetCategories}
                onSelectAllForRecipe={selectAllForRecipe}
                onClearAllForRecipe={clearAllForRecipe}
                onGenerate={() =>
                  generateRecipes(ingredients.filter((item) => selectedForRecipe.includes(ingredientKey(item))))
                }
                loading={loadingRecipe}
                recipes={recipes}
                expandedRecipeIndex={expandedRecipeIndex}
                setExpandedRecipeIndex={setExpandedRecipeIndex}
                onSaveRecipe={saveRecipe}
              />
            ) : null}

            {tab === "saved" ? (
              <SavedTab
                savedRecipes={savedRecipes}
                expandedSavedId={expandedSavedId}
                setExpandedSavedId={setExpandedSavedId}
                onDeleteSavedRecipe={deleteSavedRecipe}
              />
            ) : null}

            {tab === "shopping" ? <ShoppingTab /> : null}

            {tab === "account" ? <AccountTab email={email} /> : null}
          </div>
        </>
      )}
    </div>
  );
}