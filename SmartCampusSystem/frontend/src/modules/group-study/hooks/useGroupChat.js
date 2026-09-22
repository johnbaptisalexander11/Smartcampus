import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { fetchMessages } from "../services/groupStudyService";

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
    : "http://localhost:5000";

function getToken() {
  try {
    const raw = localStorage.getItem("canteen_auth");
    if (!raw) return null;
    return JSON.parse(raw).token || null;
  } catch {
    return null;
  }
}

export default function useGroupChat(groupId) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const socketRef = useRef(null);
  const typingTimers = useRef({});

  // Load initial message history via REST
  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoadingHistory(true);
    fetchMessages(groupId)
      .then((msgs) => {
        if (!cancelled) setMessages(msgs);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => { cancelled = true; };
  }, [groupId]);

  // Socket connection
  useEffect(() => {
    if (!groupId) return;
    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinGroup", groupId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("newMessage", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("userTyping", ({ userId, name }) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === userId)) return prev;
        return [...prev, { userId, name }];
      });

      if (typingTimers.current[userId]) clearTimeout(typingTimers.current[userId]);
      typingTimers.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        delete typingTimers.current[userId];
      }, 3000);
    });

    socket.on("userStopTyping", ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      if (typingTimers.current[userId]) {
        clearTimeout(typingTimers.current[userId]);
        delete typingTimers.current[userId];
      }
    });

    return () => {
      socket.emit("leaveGroup", groupId);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setTypingUsers([]);
      Object.values(typingTimers.current).forEach(clearTimeout);
      typingTimers.current = {};
    };
  }, [groupId]);

  const sendMessage = useCallback((content) => {
    if (socketRef.current?.connected && groupId && content?.trim()) {
      socketRef.current.emit("sendMessage", { groupId, content: content.trim() });
    }
  }, [groupId]);

  const emitTyping = useCallback(() => {
    if (socketRef.current?.connected && groupId) {
      socketRef.current.emit("typing", { groupId });
    }
  }, [groupId]);

  const emitStopTyping = useCallback(() => {
    if (socketRef.current?.connected && groupId) {
      socketRef.current.emit("stopTyping", { groupId });
    }
  }, [groupId]);

  return { messages, typingUsers, connected, loadingHistory, sendMessage, emitTyping, emitStopTyping };
}
