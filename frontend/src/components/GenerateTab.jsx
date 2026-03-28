import { RECIPE_CATEGORIES } from "../constants";
import { ingredientDisplay, normalizeText } from "../utils/ingredients";

export default function GenerateTab({
  allowExtra,
  selectedCategories,
  selectedForRecipeCount,
  onToggleCategory,
  onResetCategories,
  onSelectAllForRecipe,
  onClearAllForRecipe,
  onGenerate,
  loading,
  recipes,
  expandedRecipeIndex,
  setExpandedRecipeIndex,
  onSaveRecipe
}) {
  const missingMatch = (recipe, item) => {
    const missing = recipe?.missing_ingredients || [];
    const normalizedMissing = missing.map((value) => normalizeText(value));
    return normalizedMissing.includes(normalizeText(item));
  };

  return (
    <div className="panel">
      <h2>Generowanie</h2>

      <div className="toolbar">
        <button onClick={onSelectAllForRecipe}>Zaznacz wszystkie</button>
        <button onClick={onClearAllForRecipe}>Odznacz wszystkie</button>
      </div>

      <div className="form-grid">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={allowExtra}
            onChange={(e) => onToggleCategory("__allow_extra__", e.target.checked)}
          />
          <span>Dodawaj brakujące składniki</span>
        </label>
      </div>

      <div className="categories">
        <button
          className={selectedCategories.length === 0 ? "chip active" : "chip"}
          onClick={onResetCategories}
        >
          Dowolna
        </button>

        {RECIPE_CATEGORIES.map((category) => (
          <button
            key={category}
            className={selectedCategories.includes(category) ? "chip active" : "chip"}
            onClick={() => onToggleCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="generate-box">
        <div className="dashboard-line">
          <span>Wybrane składniki:</span>
          <strong>{selectedForRecipeCount}</strong>
        </div>

        <button onClick={onGenerate} disabled={loading}>
          {loading ? "Generowanie..." : "Generuj 3 przepisy"}
        </button>
      </div>

      <div className="recipe-grid">
        {recipes.map((recipe, index) => {
          const expanded = expandedRecipeIndex === index;

          return (
            <div key={`${recipe.title}-${index}`} className="recipe-card">
              <button
                className="recipe-title"
                onClick={() => setExpandedRecipeIndex(expanded ? null : index)}
              >
                {recipe.title || `Przepis ${index + 1}`}
              </button>

              <div className="recipe-meta">
                {recipe.categories?.length ? recipe.categories.join(", ") : "Dowolna"}
              </div>

              {expanded ? (
                <div className="recipe-body">
                  <button onClick={() => onSaveRecipe(recipe)}>Zapisz</button>

                  <h4>Składniki</h4>
                  <ul>
                    {(recipe.ingredients || []).map((item, itemIndex) => (
                      <li
                        key={`${recipe.title}-ingredient-${itemIndex}`}
                        className={missingMatch(recipe, item) ? "missing" : ""}
                      >
                        {typeof item === "string" ? item : ingredientDisplay(item)}
                      </li>
                    ))}
                  </ul>

                  <h4>Kroki</h4>
                  <ol>
                    {(recipe.steps || []).map((step, stepIndex) => (
                      <li key={`${recipe.title}-step-${stepIndex}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}