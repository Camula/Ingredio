export default function SavedTab({
  savedRecipes,
  expandedSavedId,
  setExpandedSavedId,
  onDeleteSavedRecipe,
  onAddMissingToShopping
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
              <button onClick={() => setExpandedSavedId(expandedSavedId === item.id ? null : item.id)}>
                {item.title || "Bez tytułu"}
              </button>
              <button onClick={() => onDeleteSavedRecipe(item.id)}>Usuń</button>
            </div>

            {expandedSavedId === item.id ? (
              <div className="saved-body" style={{ textAlign: "left" }}>
                <div className="saved-meta">
                  {item.categories?.length ? item.categories.join(", ") : "Dowolna"}
                </div>
                
                <div className="actions" style={{ marginBottom: 8, marginTop: 8 }}>
                  <button onClick={() => onAddMissingToShopping(item)}>Dodaj brakujące do listy zakupów</button>
                </div>

                <h4>Składniki</h4>
                <ul>
                  {(item.ingredients || []).map((ingredient, index) => (
                    <li key={`${item.id}-ingredient-${index}`}>
                      {typeof ingredient === "string" ? ingredient : ingredient?.name || ""}
                    </li>
                  ))}
                </ul>

                <h4>Kroki</h4>
                <ol>
                  {(item.steps || []).map((step, index) => (
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