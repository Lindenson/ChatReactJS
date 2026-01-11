export default function LogoutPage({ onLogout }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-200">
      <div className="bg-white p-6 rounded-xl shadow w-80 text-center">
        <h1 className="text-xl font-semibold mb-4">Cerrar sesión</h1>

        <p className="text-gray-600 mb-6">¿Seguro que quieres salir?</p>

        <button
          onClick={onLogout}
          className="w-full bg-red-600 text-white py-2 rounded"
        >
          Salir
        </button>
      </div>
    </div>
  );
}
