import { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState(null);

  const register = async () => {
    await fetch("http://127.0.0.1:8001/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
  };

  const login = async () => {
    const res = await fetch("http://127.0.0.1:8001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    setToken(data.access_token);
  };

  const addIngredient = async () => {
    await fetch("http://127.0.0.1:8002/ingredients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ name: ingredient })
    });
    getIngredients();
  };

  const getIngredients = async () => {
    const res = await fetch("http://127.0.0.1:8002/ingredients", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    const data = await res.json();
    setIngredients(data);
  };

  const deleteIngredient = async (name) => {
    await fetch(`http://127.0.0.1:8002/ingredients/${name}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    getIngredients();
  };

  const generateRecipe = async () => {
    const res = await fetch("http://127.0.0.1:8003/recipe/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, preferences: {} })
    });
    const data = await res.json();
    setRecipe(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Logowanie</h2>
      <input placeholder="email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="hasło" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={register}>Rejestruj</button>
      <button onClick={login}>Zaloguj</button>

      <h2>Dodaj składnik</h2>
      <input placeholder="np. kurczak" onChange={e => setIngredient(e.target.value)} />
      <button onClick={addIngredient}>Dodaj</button>
      <button onClick={getIngredients}>Pobierz listę</button>

      <ul>
        {ingredients.map((i, idx) => (
          <li key={idx}>
            {i}
            <button onClick={() => deleteIngredient(i)} style={{ marginLeft: 10 }}>
              Usuń
            </button>
          </li>
        ))}
      </ul>

      <h2>Przepis</h2>
      <button onClick={generateRecipe}>Generuj przepis</button>

      {recipe && !recipe.error && (
        <div>
          <h3>{recipe.title}</h3>
          <p>Czas: {recipe.estimated_time}</p>
          <p>Trudność: {recipe.difficulty}</p>

          <h4>Składniki:</h4>
          <ul>
            {(recipe.ingredients || []).map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>

          <h4>Kroki:</h4>
          <ol>
            {(recipe.steps || []).map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {recipe && recipe.error && (
        <div>
          <h3>Błąd:</h3>
          <pre>{recipe.error}</pre>
        </div>
      )}
    </div>
  );
}