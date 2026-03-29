import { useState } from "react";

export function useMessage() {
  const [message, setMessage] = useState("");

  const showMessage = (text) => {
    setMessage(text);
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => setMessage(""), 2500);
  };

  return { message, showMessage };
}