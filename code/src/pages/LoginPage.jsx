import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkChatContacts } from "@/features/chat/rest/chatApi.js";

export default function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleLogin() {
    const user = userId.trim();
    if (!user) return;

    setLoading(true);

    try {
      const exists = await checkChatContacts(user);

      if (!exists) {
        alert("Usuario no encontrado en contactos.");
        return;
      }

      onLogin(user);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      alert("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-200">
      <div className="bg-white p-6 rounded-xl shadow w-80">
        <h1 className="text-xl font-semibold mb-4">Login</h1>

        <input
          type="text"
          placeholder="Tu ID (ej: user1)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          disabled={loading}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-2 rounded text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-950 hover:bg-teal-900"
          }`}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}
