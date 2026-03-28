export default function SavedTab({
  savedRecipes,
  expandedSavedId,
  setExpandedSavedId,
  onDeleteSavedRecipe
}) {
  return (
    <div className="panel">
      <h2>Zapisane</h2>

      <div className="saved-list">
        {savedRecipes.length === 0 ? (
          <div className="empty-box">Brak zapisanych przepisów</div>
        ) : null}

        {savedRecipes.map((item) => (
          <div key={item.id} className="saved-item">
            <div className="saved-head">
              <button
                onClick={() => setExpandedSavedId(expandedSavedId === item.id ? null : item.id)}
              >
                {item.recipe?.title || "Bez tytułu"}
              </button>
              <button onClick={() => onDeleteSavedRecipe(item.id)}>Usuń</button>
            </div>

            {expandedSavedId === item.id ? (
              <div className="saved-body">
                <div className="saved-meta">
                  {item.recipe?.categories?.length ? item.recipe.categories.join(", ") : "Dowolna"}
                </div>

                <h4>Składniki</h4>
                <ul>
                  {(item.recipe?.ingredients || []).map((ingredient, index) => (
                    <li key={`${item.id}-ingredient-${index}`}>
                      {typeof ingredient === "string" ? ingredient : ingredient?.name || ""}
                    </li>
                  ))}
                </ul>

                <h4>Kroki</h4>
                <ol>
                  {(item.recipe?.steps || []).map((step, index) => (
                    <li key={`${item.id}-step-${index}`}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}