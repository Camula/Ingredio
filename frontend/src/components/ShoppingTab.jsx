import { useState } from "react";

export default function ShoppingTab({
  shoppingList,
  onAddItem,
  onToggleBought,
  onDeleteItem,
  onDeleteBought,
  onClearList,
  onMoveToFridge
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) return;
    const success = await onAddItem({ name: name.trim(), quantity: quantity.trim(), unit: unit.trim(), source: "Ręcznie" });
    if (success) {
      setName("");
      setQuantity("");
      setUnit("");
    }
  };

  const toBuy = shoppingList.filter((i) => !i.is_bought);
  const bought = shoppingList.filter((i) => i.is_bought);

  return (
    <div className="panel">
      <h2>Lista zakupów</h2>

      <div className="form-grid">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Składnik" />
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ilość" />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Jednostka" />
        <button onClick={handleAdd}>Dodaj ręcznie</button>
      </div>

      <div className="toolbar" style={{ margin: "16px 0" }}>
        <button onClick={onMoveToFridge} disabled={bought.length === 0} style={{ borderColor: "#c084fc", background: "rgba(192, 132, 252, 0.15)" }}>
          Przenieś kupione do lodówki
        </button>
        <button onClick={onDeleteBought} disabled={bought.length === 0}>Usuń kupione</button>
        <button onClick={onClearList} disabled={shoppingList.length === 0}>Wyczyść całą listę</button>
      </div>

      <div className="shopping-sections">
        <div className="shopping-box">
          <h3>Do kupienia ({toBuy.length})</h3>
          {toBuy.length === 0 ? <div className="empty-box">Brak produktów do kupienia</div> : null}
          <div className="shopping-list">
            {toBuy.map((item) => (
              <div key={item.id} className="shopping-item">
                <input type="checkbox" checked={false} onChange={() => onToggleBought(item)} />
                <div className="shopping-info">
                  <strong>{item.name}</strong> {item.quantity} {item.unit}
                  {item.source && <span className="shopping-source">Z: {item.source}</span>}
                </div>
                <button className="del-btn" onClick={() => onDeleteItem(item.id)}>X</button>
              </div>
            ))}
          </div>
        </div>

        {bought.length > 0 && (
          <div className="shopping-box">
            <h3>Kupione ({bought.length})</h3>
            <div className="shopping-list">
              {bought.map((item) => (
                <div key={item.id} className="shopping-item bought">
                  <input type="checkbox" checked={true} onChange={() => onToggleBought(item)} />
                  <div className="shopping-info">
                    <strong>{item.name}</strong> {item.quantity} {item.unit}
                  </div>
                  <button className="del-btn" onClick={() => onDeleteItem(item.id)}>X</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}