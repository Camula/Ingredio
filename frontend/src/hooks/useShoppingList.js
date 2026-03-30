import { useState } from "react";
import { API_FRIDGE } from "../constants";

export function useShoppingList(token, showMessage) {
  const [shoppingList, setShoppingList] = useState([]);

  const loadList = async (customToken) => {
    try {
      const res = await fetch(`${API_FRIDGE}/shopping`, {
        headers: { Authorization: `Bearer ${customToken || token}` }
      });
      const data = await res.json();
      setShoppingList(Array.isArray(data) ? data : []);
    } catch {
      setShoppingList([]);
    }
  };

  const addItem = async (item) => {
    try {
      const res = await fetch(`${API_FRIDGE}/shopping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(item)
      });
      const data = await res.json();
      if (!res.ok) return showMessage(data.detail || "Błąd zapisu"), false;

      await loadList();
      showMessage("Dodano na listę zakupów");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const addBulkItems = async (items) => {
    try {
      const res = await fetch(`${API_FRIDGE}/shopping/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(items)
      });
      if (!res.ok) return false;

      await loadList();
      return true;
    } catch {
      return false;
    }
  };

  const updateItem = async (id, payload) => {
    try {
      const res = await fetch(`${API_FRIDGE}/shopping/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return showMessage("Błąd aktualizacji"), false;

      await loadList();
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const toggleBought = async (item) => {
    return updateItem(item.id, {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      is_bought: item.is_bought ? 0 : 1
    });
  };

  const deleteItem = async (id) => {
    try {
      const res = await fetch(`${API_FRIDGE}/shopping/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return showMessage("Błąd usuwania"), false;

      await loadList();
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const deleteBought = async () => {
    try {
      const res = await fetch(`${API_FRIDGE}/shopping/bought`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return showMessage("Błąd usuwania"), false;

      await loadList();
      showMessage("Usunięto kupione");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const clearList = async () => {
    try {
      const res = await fetch(`${API_FRIDGE}/shopping/all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return showMessage("Błąd czyszczenia"), false;

      await loadList();
      showMessage("Wyczyszczono listę");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const moveToFridge = async () => {
    try {
      const res = await fetch(`${API_FRIDGE}/shopping/move-to-fridge`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return showMessage("Błąd przenoszenia"), false;

      await loadList();
      showMessage("Przeniesiono kupione do lodówki");
      return true;
    } catch {
      return showMessage("Błąd połączenia"), false;
    }
  };

  const clearShoppingState = () => setShoppingList([]);

  return {
    shoppingList, loadList, addItem, addBulkItems, updateItem, toggleBought,
    deleteItem, deleteBought, clearList, moveToFridge, clearShoppingState
  };
}