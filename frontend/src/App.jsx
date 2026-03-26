import { useState } from "react";
import "./App.css";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("main");
  const [message, setMessage] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);

  const [preferences, setPreferences] = useState({
    allowExtra: true
  });

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  };

  const clearUserData = () => {
    setIngredients([]);
    setRecipe(null);
    setSavedRecipes([]);
  };

  const register = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/auth/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password})
      });

      if (!res.ok) {
        const err = await res.json();
        return notify(err.detail || "Błąd rejestracji");
      }

      notify("Zarejestrowano");
    } catch {
      notify("Błąd połączenia");
    }
  };

  const login = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password})
      });

      if (!res.ok) {
        const err = await res.json();
        return notify(err.detail || "Błędne dane");
      }

      const data = await res.json();

      if (!data.access_token) {
        return notify("Logowanie nieudane");
      }

      clearUserData();
      setToken(data.access_token);
      setView("main");
      notify("Zalogowano");
      getIngredients(data.access_token);

    } catch {
      notify("Błąd połączenia");
    }
  };

  const logout = () => {
    clearUserData();
    setToken("");
    notify("Wylogowano");
  };

  const addIngredient = async () => {
    if (!ingredient.trim()) return notify("Pusty składnik");

    const res = await fetch("http://127.0.0.1:8002/ingredients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({name: ingredient})
    });

    if (!res.ok) return notify("Błąd dodawania");

    notify("Dodano składnik");
    setIngredient("");
    getIngredients();
  };

  const getIngredients = async (customToken) => {
    const res = await fetch("http://127.0.0.1:8002/ingredients", {
      headers: {"Authorization": "Bearer " + (customToken || token)}
    });
    const data = await res.json();
    setIngredients(data);
  };

  const deleteIngredient = async (name) => {
    const res = await fetch(`http://127.0.0.1:8002/ingredients/${name}`, {
      method: "DELETE",
      headers: {"Authorization": "Bearer " + token}
    });

    if (!res.ok) return notify("Błąd usuwania");

    notify("Usunięto składnik");
    getIngredients();
  };

  const clearFridge = async () => {
    const res = await fetch("http://127.0.0.1:8002/ingredients", {
      method: "DELETE",
      headers: {"Authorization": "Bearer " + token}
    });

    if (!res.ok) return notify("Błąd czyszczenia");

    notify("Wyczyszczono lodówkę");
    getIngredients();
  };

  const generateRecipe = async () => {
    setLoading(true);
    notify("Generowanie...");

    try {
      const res = await fetch("http://127.0.0.1:8003/recipe/generate", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ingredients, preferences})
      });

      if (!res.ok) {
        setLoading(false);
        return notify("Błąd generowania");
      }

      const data = await res.json();

      if (data.title) {
        setRecipe(data);
        notify("Gotowe");
      } else {
        notify("Błąd AI");
      }

    } catch {
      notify("Błąd połączenia");
    }

    setLoading(false);
  };

  const saveRecipe = async () => {
    const res = await fetch("http://127.0.0.1:8003/recipe/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({recipe})
    });

    if (!res.ok) return notify("Błąd zapisu");

    notify("Zapisano");
  };

  const getSavedRecipes = async () => {
    const res = await fetch("http://127.0.0.1:8003/recipe/saved", {
      headers: {"Authorization": "Bearer " + token}
    });
    const data = await res.json();
    setSavedRecipes(data);
  };

  return (
    <div className="container">

      <div className="header">
        <h2>Ingredio</h2>
        {token && <div className="user">{email}</div>}
      </div>

      {message && <div className="message">{message}</div>}

      {!token && (
        <div className="card">
          <input placeholder="email" onChange={e => setEmail(e.target.value)} />
          <input placeholder="hasło" type="password" onChange={e => setPassword(e.target.value)} />
          <button className="primary" onClick={register}>Rejestruj</button>
          <button className="primary" onClick={login}>Zaloguj</button>
        </div>
      )}

      {token && (
        <>
          <div className="nav">
            <button className="primary" onClick={() => setView("main")}>Główna</button>
            <button className="primary" onClick={() => { setView("saved"); getSavedRecipes(); }}>Zapisane</button>
            <button className="red" onClick={logout}>Wyloguj</button>
          </div>

          <div className="layout">

            <div className="sidebar card">
              <h3>Lodówka</h3>

              <input value={ingredient} onChange={e => setIngredient(e.target.value)} />
              <button className="green" onClick={addIngredient}>Dodaj</button>
              <button className="red" onClick={clearFridge}>Wyczyść</button>

              {ingredients.map((i, idx) => (
                <div key={idx} style={{display:"flex", justifyContent:"space-between"}}>
                  {i}
                  <button className="green" onClick={() => deleteIngredient(i)}>Usuń</button>
                </div>
              ))}
            </div>

            <div className="main">

              {view === "main" && (
                <div className="card">
                  <label>
                    <input type="checkbox" checked={preferences.allowExtra}
                      onChange={e => setPreferences({allowExtra: e.target.checked})}/>
                    Uzupełnij składniki
                  </label>

                  <button className="green" onClick={generateRecipe}>Generuj</button>

                  {loading && <p>Ładowanie...</p>}

                  {recipe && (
                    <div>
                      <h3>{recipe.title}</h3>
                      <button className="primary" onClick={saveRecipe}>Zapisz</button>

                      <ul>
                        {recipe.ingredients?.map((i, idx) => (
                          <li key={idx} style={{
                            color: recipe.missing_ingredients?.includes(i.toLowerCase()) ? "red" : "black"
                          }}>
                            {i}
                          </li>
                        ))}
                      </ul>

                      <ol>
                        {recipe.steps?.map((s, idx) => <li key={idx}>{s}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {view === "saved" && (
                <div className="card">
                  {savedRecipes.map((r, idx) => (
                    <div key={idx}>
                      <h4 onClick={() => setExpandedIndex(idx === expandedIndex ? null : idx)}>
                        {r.title}
                      </h4>

                      {expandedIndex === idx && (
                        <>
                          <ul>{r.ingredients?.map((i, i2) => <li key={i2}>{i}</li>)}</ul>
                          <ol>{r.steps?.map((s, i2) => <li key={i2}>{s}</li>)}</ol>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}