import { useEffect, useState } from "react";
import { INGREDIENT_SUGGESTIONS } from "../constants";
import { ingredientDisplay, ingredientKey, normalizeText } from "../utils/ingredients";

export default function FridgeTab({
  ingredients,
  selectedIngredientKey,
  selectedForRecipe,
  selectedIngredient,
  onSelectIngredientForActions,
  onToggleRecipeSelection,
  onSelectAllForRecipe,
  onClearAllForRecipe,
  onAddIngredient,
  onUpdateSelectedIngredient,
  onDeleteSelectedIngredient,
  onClearFridge
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnit, setEditUnit] = useState("");

  useEffect(() => {
    if (!selectedIngredient) {
      setEditMode(false);
      return;
    }

    if (editMode) {
      setEditName(selectedIngredient.name || "");
      setEditQuantity(selectedIngredient.quantity || "");
      setEditUnit(selectedIngredient.unit || "");
    }
  }, [selectedIngredient, editMode]);

  const handleNameChange = (value) => {
    setName(value);

    const trimmed = normalizeText(value);
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    setSuggestions(
      INGREDIENT_SUGGESTIONS.filter((item) => normalizeText(item).includes(trimmed)).slice(0, 8)
    );
  };

  const addIngredient = async () => {
    const success = await onAddIngredient({
      name,
      quantity,
      unit
    });

    if (success) {
      setName("");
      setQuantity("");
      setUnit("");
      setSuggestions([]);
    }
  };

  const startEdit = () => {
    if (!selectedIngredient) {
      return;
    }

    setEditName(selectedIngredient.name || "");
    setEditQuantity(selectedIngredient.quantity || "");
    setEditUnit(selectedIngredient.unit || "");
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!selectedIngredient) {
      return;
    }

    const success = await onUpdateSelectedIngredient(selectedIngredient.name, {
      name: editName,
      quantity: editQuantity,
      unit: editUnit
    });

    if (success) {
      setEditMode(false);
    }
  };

  const selectedSet = new Set(selectedForRecipe);

  return (
    <div className="panel">
      <h2>Lodówka</h2>

      <div className="form-grid">
        <input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Składnik"
        />
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Ilość"
        />
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Jednostka"
        />
        <button onClick={addIngredient}>Dodaj</button>
      </div>

      {suggestions.length ? (
        <div className="suggestions">
          {suggestions.map((item) => (
            <button
              key={item}
              className="suggestion"
              onClick={() => {
                setName(item);
                setSuggestions([]);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      <div className="toolbar">
        <button onClick={onSelectAllForRecipe}>Zaznacz wszystkie do przepisu</button>
        <button onClick={onClearAllForRecipe}>Odznacz wszystkie</button>
        <button onClick={startEdit} disabled={!selectedIngredient}>
          Edytuj wybrany
        </button>
        <button onClick={onDeleteSelectedIngredient} disabled={!selectedIngredient}>
          Usuń wybrany
        </button>
        <button onClick={onClearFridge}>Wyczyść lodówkę</button>
      </div>

      {editMode && selectedIngredient ? (
        <div className="edit-box">
          <h3>Edycja</h3>
          <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nazwa" />
          <input
            value={editQuantity}
            onChange={(e) => setEditQuantity(e.target.value)}
            placeholder="Ilość"
          />
          <input value={editUnit} onChange={(e) => setEditUnit(e.target.value)} placeholder="Jednostka" />
          <div className="actions">
            <button onClick={saveEdit}>Zapisz</button>
            <button onClick={() => setEditMode(false)}>Anuluj</button>
          </div>
        </div>
      ) : null}

      <div className="ingredient-list">
        {ingredients.map((item) => {
          const key = ingredientKey(item);
          const actionSelected = selectedIngredientKey === key;
          const recipeSelected = selectedSet.has(key);

          return (
            <div
              key={key || ingredientDisplay(item)}
              className={actionSelected ? "ingredient-row selected" : "ingredient-row"}
              onClick={() => onSelectIngredientForActions(item)}
            >
              <input
                type="checkbox"
                checked={recipeSelected}
                onChange={() => onToggleRecipeSelection(item)}
                onClick={(e) => e.stopPropagation()}
              />
              <span>{ingredientDisplay(item)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}