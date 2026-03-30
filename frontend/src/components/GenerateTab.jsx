import { useMemo, useState } from "react";
import { RECIPE_CATEGORY_GROUPS } from "../constants";
import { ingredientDisplay, ingredientKey, normalizeText, toIngredient, isMissingIngredient } from "../utils/ingredients";

function buildRecipeSignature(recipe) {
  const title = normalizeText(recipe?.title || "");
  const ingredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients.map((item) => normalizeText(typeof item === "string" ? item : ingredientDisplay(item))).join("|")
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
  onSaveRecipe,
  onAddMissingToShopping
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
    if (allSelected) onClearAllForRecipe?.();
    else onSelectAllForRecipe?.();
  };

  const handleRemoveIngredient = (item) => {
    if (ingredientKey(item) === normalizeText(mainIngredientKey)) onSetMainIngredient?.(null);
    if (typeof onRemoveSelectedIngredient === "function") onRemoveSelectedIngredient(item);
    else if (typeof onToggleRecipeSelection === "function") onToggleRecipeSelection(item);
  };

  const selectedRecipeSignature = selectedRecipe ? buildRecipeSignature(selectedRecipe) : "";

  return (
    <div className="panel">
      <h2>Generowanie</h2>

      <div className="toolbar">
        <button onClick={handleToggleAll}>{allSelected ? "Odznacz wszystkie" : "Zaznacz wszystkie"}</button>
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
                <div key={`${key}-${ingredientDisplay(item)}`} className="ingredient-row" onClick={() => onSetMainIngredient?.(item)} style={isMain ? { borderColor: "#c084fc", background: "#2a2034" } : undefined}>
                  <div style={{ display: "grid", gap: 4, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong>{ingredientDisplay(item)}</strong>
                      {isMain ? <span className="recipe-meta">główny</span> : null}
                    </div>
                    <div className="recipe-meta">Kliknij, aby ustawić jako główny</div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveIngredient(item); }}>X</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-box">Brak wybranych składników</div>
        )}

        <div className="actions" style={{ marginTop: 12 }}>
          <button onClick={onGenerate} disabled={loading || selectedCount === 0}>{loading ? "Generowanie..." : "Generuj"}</button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
        {RECIPE_CATEGORY_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="recipe-meta" style={{ marginBottom: 8, color: "#e5e5e5" }}>{group.title}</div>
            <div className="categories" style={{ marginTop: 0 }}>
              {group.items.map((category) => (
                <button key={`${group.title}-${category}`} className={selectedCategoryByGroup?.[group.title] === category ? "chip active" : "chip"} onClick={() => onSelectCategory?.(group.title, category)}>
                  {category}
                </button>
              ))}
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
            <button onClick={onGenerate} disabled={loading}>{loading ? "Generowanie..." : "Generuj ponownie"}</button>
            {typeof onSaveRecipe === "function" && <button onClick={() => onSaveRecipe(selectedRecipe)}>Dodaj do ulubionych</button>}
            <button onClick={() => onAddMissingToShopping(selectedRecipe)}>Dodaj brakujące do listy zakupów</button>
          </div>

          {selectedRecipe.categories?.length ? <div className="recipe-meta" style={{ marginBottom: 12 }}>{selectedRecipe.categories.join(", ")}</div> : null}

          <h4>Składniki</h4>
          <ul>
            {(selectedRecipe.ingredients || []).map((item, index) => (
              <li key={`${selectedRecipeSignature}-ingredient-${index}`} className={isMissingIngredient(item, ingredients) ? "missing" : ""}>
                {typeof item === "string" ? item : ingredientDisplay(item)}
              </li>
            ))}
          </ul>

          <h4>Kroki</h4>
          <ol>
            {(selectedRecipe.steps || []).map((step, index) => <li key={`${selectedRecipeSignature}-step-${index}`}>{step}</li>)}
          </ol>
        </div>
      ) : null}

      {!showSelectedRecipe && currentRecipes.length > 0 ? (
        <div className="recipe-grid" style={{ marginBottom: 12 }}>
          {currentRecipes.map((recipe, index) => {
            const signature = buildRecipeSignature(recipe);
            return (
              <div key={`${signature}-${index}`} className="recipe-card">
                <div className="recipe-title" style={{ padding: "8px 10px" }}>{recipe.title || `Przepis ${index + 1}`}</div>
                <div className="recipe-meta">{recipe.categories?.length ? recipe.categories.join(", ") : "Dowolna"}</div>
                
                <h4>Składniki</h4>
                <ul>
                  {(recipe.ingredients || []).map((item, itemIndex) => (
                    <li key={`${signature}-ingredient-${itemIndex}`} className={isMissingIngredient(item, ingredients) ? "missing" : ""}>
                      {typeof item === "string" ? item : ingredientDisplay(item)}
                    </li>
                  ))}
                </ul>
                <button onClick={() => onChooseRecipe?.(index)}>Wybieram ten</button>
              </div>
            );
          })}
        </div>
      ) : (!showSelectedRecipe ? <div className="empty-box" style={{ marginBottom: 12 }}>Po wygenerowaniu pojawią się tutaj 2 przepisy.</div> : null)}

      <div className="saved-list">
        <button type="button" onClick={() => setHistoryOpen((prev) => !prev)} style={{ textAlign: "left" }}>Historia generowania</button>
        {historyOpen ? (
          <div style={{ display: "grid", gap: 12 }}>
            {historyRecipes.length === 0 ? <div className="empty-box">Brak historii</div> : null}
            {historyRecipes.map((recipe) => {
              const signature = buildRecipeSignature(recipe);
              const expanded = expandedHistorySignature === signature;

              return (
                <div key={signature} className="saved-item">
                  <div className="saved-head">
                    <button onClick={() => setExpandedHistorySignature(expanded ? null : signature)}>{recipe.title || "Bez tytułu"}</button>
                    {typeof onSaveRecipe === "function" && <button onClick={() => onSaveRecipe(recipe)}>Dodaj do ulubionych</button>}
                  </div>

                  {expanded ? (
                    <div className="saved-body">
                      <div className="saved-meta">{recipe.categories?.length ? recipe.categories.join(", ") : "Dowolna"}</div>
                      
                      <div className="actions" style={{ marginBottom: 8 }}>
                        <button onClick={() => onAddMissingToShopping(recipe)}>Dodaj brakujące do listy zakupów</button>
                      </div>

                      <h4>Składniki</h4>
                      <ul>
                        {(recipe.ingredients || []).map((ingredient, index) => (
                          <li key={`${signature}-history-ingredient-${index}`} className={isMissingIngredient(ingredient, ingredients) ? "missing" : ""}>
                            {typeof ingredient === "string" ? ingredient : ingredientDisplay(ingredient)}
                          </li>
                        ))}
                      </ul>

                      <h4>Kroki</h4>
                      <ol>
                        {(recipe.steps || []).map((step, index) => <li key={`${signature}-history-step-${index}`}>{step}</li>)}
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