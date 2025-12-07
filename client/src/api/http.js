import axios from "axios";

// ===============================
// CONFIG AXIOS
// ===============================
/*const api = axios.create({
  baseURL: "https://curacavi-backend.onrender.com",
  withCredentials: true,
});*/

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ===============================
// INYECTAR TOKEN AUTOMÁTICAMENTE
// ===============================
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // SOLO usar JSON si NO es FormData
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  } else {
    // Axios se encarga del boundary automáticamente
    delete config.headers["Content-Type"];
  }

  return config;
});

// ===============================
// LOGOUT GLOBAL (TOKEN EXPIRADO)
// ===============================
let redirecting = false;
const autoLogout = () => {
  if (redirecting) return;
  redirecting = true;

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  window.location.href = "/login?expired=1";
};

// ===============================
// MANEJO DE ERRORES
// ===============================
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    // Token inválido o expirado
    if (status === 401) autoLogout();

    // Backend no responde
    if (!err.response) return Promise.reject("Servidor no disponible");

    // Mensaje corporativo
    const msg =
      err.response.data?.message ||
      err.response.data?.error ||
      `Error ${status}`;

    return Promise.reject(msg);
  }
);

// ===============================
// EXPORT
// ===============================
export default api;
