export default function Dashboard({
  ingredientCount,
  selectedCount,
  recipeCount,
  savedCount,
  lastRecipeTitle,
  onQuickGenerate,
  onGoGenerate,
  onGoFridge
}) {
  return (
    <div className="panel dashboard-panel">
      <h2>Dashboard</h2>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">Składniki w lodówce</div>
          <div className="stat-value">{ingredientCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Wybrane do przepisu</div>
          <div className="stat-value">{selectedCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Wygenerowane przepisy</div>
          <div className="stat-value">{recipeCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Zapisane przepisy</div>
          <div className="stat-value">{savedCount}</div>
        </div>
      </div>

      <div className="dashboard-box">
        <div className="dashboard-line">
          <span>Ostatni przepis:</span>
          <strong>{lastRecipeTitle || "brak"}</strong>
        </div>

        <div className="actions">
          <button onClick={onQuickGenerate}>Szybko generuj</button>
          <button onClick={onGoGenerate}>Przejdź do generowania</button>
          <button onClick={onGoFridge}>Otwórz lodówkę</button>
        </div>
      </div>
    </div>
  );
}