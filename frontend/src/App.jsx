import { useState } from "react";
import "./App.css";

import TabNav from "./components/TabNav";
import Dashboard from "./components/Dashboard";
import FridgeTab from "./components/FridgeTab";
import GenerateTab from "./components/GenerateTab";
import SavedTab from "./components/SavedTab";
import ShoppingTab from "./components/ShoppingTab";
import AccountTab from "./components/AccountTab";
import { ingredientKey } from "./utils/ingredients";

import { useMessage } from "./hooks/useMessage";
import { useAuth } from "./hooks/useAuth";
import { useFridge } from "./hooks/useFridge";
import { useRecipes } from "./hooks/useRecipes";
import { useSavedRecipes } from "./hooks/useSavedRecipes";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const { message, showMessage } = useMessage();

  const handleLoginSuccess = async (customToken) => {
    await fridge.refreshIngredients(customToken);
    await saved.loadSavedRecipes(customToken);
    setTab("dashboard");
  };

  const handleLogoutSuccess = () => {
    fridge.clearFridgeState();
    recipesState.clearRecipesState();
    saved.clearSavedState();
    setTab("dashboard");
  };

  const auth = useAuth(showMessage, handleLoginSuccess, handleLogoutSuccess);
  const fridge = useFridge(auth.token, showMessage);
  const recipesState = useRecipes(auth.token, showMessage);
  const saved = useSavedRecipes(auth.token, showMessage);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">Ingredio</div>
        <div className="topbar-right">
          {auth.token ? <span className="topbar-email">{auth.email}</span> : null}
          {auth.token ? <button onClick={auth.logout}>Wyloguj</button> : null}
        </div>
      </div>

      {message ? <div className="message">{message}</div> : null}

      {!auth.token ? (
        <div className="auth-shell">
          <div className="panel auth-panel">
            <h2>Logowanie</h2>
            <input
              value={auth.email}
              onChange={(e) => auth.setEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              value={auth.password}
              onChange={(e) => auth.setPassword(e.target.value)}
              placeholder="Hasło"
              type="password"
            />
            <div className="actions">
              <button onClick={auth.register}>Rejestruj</button>
              <button onClick={auth.login}>Zaloguj</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <TabNav tab={tab} onChange={setTab} />

          <div className="content">
            {tab === "dashboard" ? (
              <Dashboard
                ingredientCount={fridge.ingredients.length}
                selectedCount={fridge.selectedForRecipe.length}
                recipeCount={recipesState.recipes.length}
                savedCount={saved.savedRecipes.length}
                lastRecipeTitle={recipesState.selectedRecipe?.title || recipesState.recipes[0]?.title}
                onQuickGenerate={() => recipesState.generateRecipes(fridge.ingredients, fridge.mainIngredientKey, setTab)}
                onGoGenerate={() => setTab("generate")}
                onGoFridge={() => setTab("fridge")}
              />
            ) : null}

            {tab === "fridge" ? (
              <FridgeTab
                ingredients={fridge.ingredients}
                selectedIngredientKey={fridge.selectedIngredientKey}
                selectedForRecipe={fridge.selectedForRecipe}
                selectedIngredient={fridge.selectedIngredient}
                onSelectIngredientForActions={(item) => fridge.setSelectedIngredientKey(ingredientKey(item))}
                onToggleRecipeSelection={fridge.toggleIngredientForRecipe}
                onSelectAllForRecipe={fridge.selectAllForRecipe}
                onClearAllForRecipe={fridge.clearAllForRecipe}
                onAddIngredient={fridge.addIngredient}
                onUpdateSelectedIngredient={fridge.updateSelectedIngredient}
                onDeleteSelectedIngredient={fridge.deleteSelectedIngredient}
                onClearFridge={fridge.clearFridge}
              />
            ) : null}

            {tab === "generate" ? (
              <GenerateTab
                ingredients={fridge.ingredients}
                selectedIngredients={fridge.selectedIngredients}
                selectedIngredientKeys={fridge.selectedForRecipe}
                selectedForRecipeCount={fridge.selectedForRecipe.length}
                mainIngredientKey={fridge.mainIngredientKey}
                onSetMainIngredient={(item) => fridge.setMainIngredientKey(item ? ingredientKey(item) : "")}
                allowExtra={recipesState.allowExtra}
                selectedCategoryByGroup={recipesState.selectedCategoryByGroup}
                onSelectCategory={recipesState.selectCategoryForGroup}
                onSelectAllForRecipe={fridge.selectAllForRecipe}
                onClearAllForRecipe={fridge.clearAllForRecipe}
                onToggleRecipeSelection={fridge.toggleIngredientForRecipe}
                onRemoveSelectedIngredient={fridge.toggleIngredientForRecipe}
                onGenerate={() =>
                  recipesState.generateRecipes(
                    fridge.ingredients.filter((item) => fridge.selectedForRecipe.includes(ingredientKey(item))),
                    fridge.mainIngredientKey,
                    setTab
                  )
                }
                loading={recipesState.loadingRecipe}
                recipes={recipesState.recipes}
                selectedRecipe={recipesState.selectedRecipe}
                historyRecipes={recipesState.historyRecipes}
                onChooseRecipe={recipesState.chooseGeneratedRecipe}
                onSaveRecipe={saved.saveRecipe}
                onResetCategories={recipesState.resetCategories}
              />
            ) : null}

            {tab === "saved" ? (
              <SavedTab
                savedRecipes={saved.savedRecipes}
                expandedSavedId={saved.expandedSavedId}
                setExpandedSavedId={saved.setExpandedSavedId}
                onDeleteSavedRecipe={saved.deleteSavedRecipe}
              />
            ) : null}

            {tab === "shopping" ? <ShoppingTab /> : null}
            {tab === "account" ? <AccountTab email={auth.email} /> : null}
          </div>
        </>
      )}
    </div>
  );
}