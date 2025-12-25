import { io } from "socket.io-client";
import { getCookie } from "../helpers/cookie";

const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL || "").trim() || "https://be-dw0z.onrender.com/";

const SOCKET_URL = API_BASE_URL.endsWith("/")
  ? API_BASE_URL.slice(0, -1)
  : API_BASE_URL;

let socket = null;

export const connectSocket = () => {
  try {
    const token = localStorage.getItem("token") || getCookie("token");
    if (!token) return null;

    if (socket && socket.connected) return socket;

    if (socket) {
      try {
        socket.disconnect();
      } catch (_e) {}
      socket = null;
    }

    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on("notification:new", (payload) => {
      try {
        window.dispatchEvent(new CustomEvent("notification:new", { detail: payload }));
      } catch (_e) {}
    });

    socket.on("chat:message", (payload) => {
      try {
        window.dispatchEvent(new CustomEvent("chat:message", { detail: payload }));
      } catch (_e) {}
    });

    socket.on("chat:typing", (payload) => {
      try {
        window.dispatchEvent(new CustomEvent("chat:typing", { detail: payload }));
      } catch (_e) {}
    });

    socket.on("chat:seen", (payload) => {
      try {
        window.dispatchEvent(new CustomEvent("chat:seen", { detail: payload }));
      } catch (_e) {}
    });

    socket.on("presence:list", (payload) => {
      try {
        window.dispatchEvent(new CustomEvent("presence:list", { detail: payload }));
      } catch (_e) {}
    });

    socket.on("presence:update", (payload) => {
      try {
        window.dispatchEvent(new CustomEvent("presence:update", { detail: payload }));
      } catch (_e) {}
    });

    return socket;
  } catch (_e) {
    return null;
  }
};

export const disconnectSocket = () => {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch (_e) {}
  socket = null;
};

export const getSocket = () => socket;
