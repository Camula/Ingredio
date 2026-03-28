import { useMemo, useState } from "react";
import { RECIPE_CATEGORY_GROUPS } from "../constants";
import { ingredientDisplay, ingredientKey, normalizeText, toIngredient } from "../utils/ingredients";

const IGNORED_MISSING_TERMS = [
  "sól",
  "pieprz",
  "woda",
  "olej",
  "oliwa",
  "masło",
  "cukier",
  "bazylia",
  "oregano",
  "tymianek",
  "rozmaryn",
  "papryka",
  "przyprawa",
  "przyprawy",
  "czosnek granulowany",
  "cebula granulowana",
  "bulion",
  "kostka rosołowa"
];

function stripDiacritics(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeLoose(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemToken(token) {
  const suffixes = [
    "owego",
    "owej",
    "owych",
    "ami",
    "owi",
    "ach",
    "ego",
    "emu",
    "owie",
    "owy",
    "owa",
    "owe",
    "ów",
    "ow",
    "om",
    "em",
    "ie",
    "y",
    "i",
    "e",
    "a",
    "u",
    "ą",
    "ę"
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

function normalizeIngredientName(value) {
  return normalizeLoose(value)
    .split(" ")
    .filter(Boolean)
    .map(stemToken)
    .join(" ");
}

function isIgnoredMissingItem(item) {
  const normalized = normalizeLoose(typeof item === "string" ? item : ingredientDisplay(item));
  return IGNORED_MISSING_TERMS.some((term) => normalized.includes(normalizeLoose(term)));
}

function isMissingIngredient(recipe, item, allowExtra) {
  if (allowExtra) {
    return false;
  }

  if (isIgnoredMissingItem(item)) {
    return false;
  }

  const missing = Array.isArray(recipe?.missing_ingredients) ? recipe.missing_ingredients : [];
  if (!missing.length) {
    return false;
  }

  const itemNorm = normalizeIngredientName(typeof item === "string" ? item : ingredientDisplay(item));

  return missing.some((value) => {
    const missingNorm = normalizeIngredientName(value);
    if (!missingNorm || !itemNorm) {
      return false;
    }

    return (
      missingNorm === itemNorm ||
      missingNorm.includes(itemNorm) ||
      itemNorm.includes(missingNorm)
    );
  });
}

function buildRecipeSignature(recipe) {
  const title = normalizeText(recipe?.title || "");
  const ingredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients
        .map((item) => normalizeText(typeof item === "string" ? item : ingredientDisplay(item)))
        .join("|")
    : "";
  const steps = Array.isArray(recipe?.steps)
    ? recipe.steps.map((step) => normalizeText(step)).join("|")
    : "";
  const categories = Array.isArray(recipe?.categories)
    ? recipe.categories.map((item) => normalizeText(item)).join("|")
    : "";

  return `${title}__${ingredients}__${steps}__${categories}`;
}

export default function GenerateTab({
  ingredients = [],
  selectedIngredients = [],
  selectedIngredientKeys = [],
  selectedForRecipeCount = 0,
  mainIngredientKey = "",
  onSetMainIngredient,
  allowExtra = true,
  selectedCategoryByGroup = {},
  onSelectCategory,
  onSelectAllForRecipe,
  onClearAllForRecipe,
  onToggleRecipeSelection,
  onRemoveSelectedIngredient,
  onGenerate,
  loading = false,
  recipes = [],
  selectedRecipe = null,
  historyRecipes = [],
  onChooseRecipe,
  onSaveRecipe
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedHistorySignature, setExpandedHistorySignature] = useState(null);

  const selectedList = useMemo(() => {
    if (Array.isArray(selectedIngredients) && selectedIngredients.length) {
      return selectedIngredients.map(toIngredient);
    }

    if (Array.isArray(ingredients) && ingredients.length && Array.isArray(selectedIngredientKeys)) {
      const keySet = new Set(selectedIngredientKeys.map((value) => normalizeText(value)));
      return ingredients.map(toIngredient).filter((item) => keySet.has(ingredientKey(item)));
    }

    return [];
  }, [selectedIngredients, ingredients, selectedIngredientKeys]);

  const selectedCount = selectedList.length || selectedForRecipeCount || 0;
  const allSelected = ingredients.length > 0 && selectedList.length === ingredients.length;
  const currentRecipes = Array.isArray(recipes) ? recipes.slice(0, 2) : [];
  const showSelectedRecipe = Boolean(selectedRecipe);

  const handleToggleAll = () => {
    if (allSelected) {
      onClearAllForRecipe?.();
      return;
    }

    onSelectAllForRecipe?.();
  };

  const handleRemoveIngredient = (item) => {
    if (ingredientKey(item) === normalizeText(mainIngredientKey)) {
      onSetMainIngredient?.(null);
    }

    if (typeof onRemoveSelectedIngredient === "function") {
      onRemoveSelectedIngredient(item);
      return;
    }

    if (typeof onToggleRecipeSelection === "function") {
      onToggleRecipeSelection(item);
    }
  };

  const handleChooseRecipe = (index) => {
    if (typeof onChooseRecipe === "function") {
      onChooseRecipe(index);
    }
  };

  const handleSelectCategory = (groupTitle, category) => {
    if (typeof onSelectCategory === "function") {
      onSelectCategory(groupTitle, category);
    }
  };

  const selectedRecipeSignature = selectedRecipe ? buildRecipeSignature(selectedRecipe) : "";

  return (
    <div className="panel">
      <h2>Generowanie</h2>

      <div className="toolbar">
        <button onClick={handleToggleAll}>
          {allSelected ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
        </button>
      </div>

      <div className="generate-box">
        <div className="dashboard-line">
          <span>Wybrane składniki:</span>
          <strong>{selectedCount}</strong>
        </div>

        {selectedList.length ? (
          <div className="ingredient-list">
            {selectedList.map((item) => {
              const key = ingredientKey(item);
              const isMain = key === normalizeText(mainIngredientKey);

              return (
                <div
                  key={`${key}-${ingredientDisplay(item)}`}
                  className="ingredient-row"
                  onClick={() => onSetMainIngredient?.(item)}
                  style={
                    isMain
                      ? {
                          borderColor: "#c084fc",
                          background: "#2a2034"
                        }
                      : undefined
                  }
                >
                  <div style={{ display: "grid", gap: 4, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong>{ingredientDisplay(item)}</strong>
                      {isMain ? <span className="recipe-meta">główny</span> : null}
                    </div>
                    <div className="recipe-meta">Kliknij, aby ustawić jako główny</div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveIngredient(item);
                    }}
                  >
                    X
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-box">Brak wybranych składników</div>
        )}

        <div className="actions" style={{ marginTop: 12 }}>
          <button onClick={onGenerate} disabled={loading || selectedCount === 0}>
            {loading ? "Generowanie..." : "Generuj"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
        {RECIPE_CATEGORY_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="recipe-meta" style={{ marginBottom: 8, color: "#e5e5e5" }}>
              {group.title}
            </div>

            <div className="categories" style={{ marginTop: 0 }}>
              {group.items.map((category) => {
                const active = selectedCategoryByGroup?.[group.title] === category;

                return (
                  <button
                    key={`${group.title}-${category}`}
                    className={active ? "chip active" : "chip"}
                    onClick={() => handleSelectCategory(group.title, category)}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showSelectedRecipe ? (
        <div className="dashboard-box" style={{ marginBottom: 12 }}>
          <div className="dashboard-line">
            <span>Wybrany przepis:</span>
            <strong>{selectedRecipe.title || "Bez tytułu"}</strong>
          </div>

          <div className="actions" style={{ marginBottom: 12 }}>
            <button onClick={onGenerate} disabled={loading}>
              {loading ? "Generowanie..." : "Generuj ponownie"}
            </button>
            {typeof onSaveRecipe === "function" ? (
              <button onClick={() => onSaveRecipe(selectedRecipe)}>Dodaj do ulubionych</button>
            ) : null}
          </div>

          {selectedRecipe.categories?.length ? (
            <div className="recipe-meta" style={{ marginBottom: 12 }}>
              {selectedRecipe.categories.join(", ")}
            </div>
          ) : null}

          <h4>Składniki</h4>
          <ul>
            {(selectedRecipe.ingredients || []).map((item, index) => (
              <li
                key={`${selectedRecipeSignature}-ingredient-${index}`}
                className={isMissingIngredient(selectedRecipe, item, allowExtra) ? "missing" : ""}
              >
                {typeof item === "string" ? item : ingredientDisplay(item)}
              </li>
            ))}
          </ul>

          <h4>Kroki</h4>
          <ol>
            {(selectedRecipe.steps || []).map((step, index) => (
              <li key={`${selectedRecipeSignature}-step-${index}`}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {!showSelectedRecipe ? (
        currentRecipes.length ? (
          <div className="recipe-grid" style={{ marginBottom: 12 }}>
            {currentRecipes.map((recipe, index) => {
              const signature = buildRecipeSignature(recipe);

              return (
                <div key={`${signature}-${index}`} className="recipe-card">
                  <div className="recipe-title" style={{ padding: "8px 10px" }}>
                    {recipe.title || `Przepis ${index + 1}`}
                  </div>

                  {recipe.categories?.length ? (
                    <div className="recipe-meta">{recipe.categories.join(", ")}</div>
                  ) : (
                    <div className="recipe-meta">Dowolna</div>
                  )}

                  <h4>Składniki</h4>
                  <ul>
                    {(recipe.ingredients || []).map((item, itemIndex) => (
                      <li
                        key={`${signature}-ingredient-${itemIndex}`}
                        className={isMissingIngredient(recipe, item, allowExtra) ? "missing" : ""}
                      >
                        {typeof item === "string" ? item : ingredientDisplay(item)}
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => handleChooseRecipe(index)}>Wybieram ten</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-box" style={{ marginBottom: 12 }}>
            Po wygenerowaniu pojawią się tutaj 2 przepisy.
          </div>
        )
      ) : null}

      <div className="saved-list">
        <button
          type="button"
          onClick={() => setHistoryOpen((prev) => !prev)}
          style={{ textAlign: "left" }}
        >
          Historia generowania
        </button>

        {historyOpen ? (
          <div style={{ display: "grid", gap: 12 }}>
            {historyRecipes.length === 0 ? <div className="empty-box">Brak historii</div> : null}

            {historyRecipes.map((recipe) => {
              const signature = buildRecipeSignature(recipe);
              const expanded = expandedHistorySignature === signature;

              return (
                <div key={signature} className="saved-item">
                  <div className="saved-head">
                    <button
                      onClick={() =>
                        setExpandedHistorySignature(expanded ? null : signature)
                      }
                    >
                      {recipe.title || "Bez tytułu"}
                    </button>

                    {typeof onSaveRecipe === "function" ? (
                      <button onClick={() => onSaveRecipe(recipe)}>Dodaj do ulubionych</button>
                    ) : null}
                  </div>

                  {expanded ? (
                    <div className="saved-body">
                      {recipe.categories?.length ? (
                        <div className="saved-meta">{recipe.categories.join(", ")}</div>
                      ) : (
                        <div className="saved-meta">Dowolna</div>
                      )}

                      <h4>Składniki</h4>
                      <ul>
                        {(recipe.ingredients || []).map((ingredient, index) => (
                          <li
                            key={`${signature}-history-ingredient-${index}`}
                            className={isMissingIngredient(recipe, ingredient, allowExtra) ? "missing" : ""}
                          >
                            {typeof ingredient === "string"
                              ? ingredient
                              : ingredientDisplay(ingredient)}
                          </li>
                        ))}
                      </ul>

                      <h4>Kroki</h4>
                      <ol>
                        {(recipe.steps || []).map((step, index) => (
                          <li key={`${signature}-history-step-${index}`}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}