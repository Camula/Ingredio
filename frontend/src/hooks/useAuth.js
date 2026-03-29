import { useState } from "react";
import { API_AUTH } from "../constants";

export function useAuth(showMessage, onLoginSuccess, onLogoutSuccess) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const register = async () => {
    try {
      const res = await fetch(`${API_AUTH}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return showMessage(data.detail || "Błąd rejestracji");
      showMessage("Zarejestrowano");
    } catch {
      showMessage("Błąd połączenia");
    }
  };

  const login = async () => {
    try {
      const res = await fetch(`${API_AUTH}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) return showMessage(data.detail || "Błędne dane");
      if (!data.access_token) return showMessage("Brak tokena");

      setToken(data.access_token);
      showMessage("Zalogowano");
      
      if (onLoginSuccess) {
        await onLoginSuccess(data.access_token);
      }
    } catch {
      showMessage("Błąd połączenia");
    }
  };

  const logout = () => {
    setToken("");
    showMessage("Wylogowano");
    if (onLogoutSuccess) {
      onLogoutSuccess();
    }
  };

  return { email, setEmail, password, setPassword, token, register, login, logout };
}