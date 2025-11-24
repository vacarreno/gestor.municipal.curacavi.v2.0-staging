//client/src/pages/services/billeteraService.js
import axios from "axios";

const API = "https://curacavi-backend.onrender.com";

export const getVecinos = () =>
  axios.get(`${API}/billetera/vecinos`);

export const updateSaldo = (id, monto) =>
  axios.put(`${API}/billetera/vecinos/${id}/saldo`, { monto });

export const regenerarQR = (id) =>
  axios.post(`${API}/billetera/vecinos/${id}/qr`);
