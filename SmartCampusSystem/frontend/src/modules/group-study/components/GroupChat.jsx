import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import useGroupChat from "../hooks/useGroupChat";

const GroupChat = ({ groupId }) => {
  const { user } = useAuth();
  const {
    messages,
    typingUsers,
    connected,
    loadingHistory,
    sendMessage,
    emitTyping,
    emitStopTyping,
  } = useGroupChat(groupId);

  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
    emitStopTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    emitTyping();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitStopTyping(), 2000);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = "";
  messages.forEach((msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (dateKey !== lastDate) {
      groupedMessages.push({ type: "date", date: formatDate(msg.createdAt), key: dateKey });
      lastDate = dateKey;
    }
    groupedMessages.push({ type: "msg", data: msg, key: msg._id });
  });

  const currentUserId = user?._id || user?.id;

  return (
    <div className="gc-chat-container">
      <div className="gc-chat-header">
        <h3 className="gc-chat-title">💬 Group Chat</h3>
        <span className={`gc-chat-status ${connected ? "gc-chat-status--on" : ""}`}>
          {connected ? "Connected" : "Connecting..."}
        </span>
      </div>

      <div className="gc-chat-messages">
        {loadingHistory && <p className="gc-chat-loading">Loading messages...</p>}

        {!loadingHistory && messages.length === 0 && (
          <div className="gc-chat-empty">
            <span className="gc-chat-empty-icon">💬</span>
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {groupedMessages.map((item) =>
          item.type === "date" ? (
            <div key={item.key} className="gc-chat-date-sep">
              <span>{item.date}</span>
            </div>
          ) : (
            (() => {
              const msg = item.data;
              const senderId = msg.sender?._id || msg.sender;
              const isOwn = String(senderId) === String(currentUserId);
              return (
                <div key={item.key} className={`gc-chat-bubble ${isOwn ? "gc-chat-bubble--own" : ""}`}>
                  {!isOwn && (
                    <span className="gc-chat-sender">{msg.sender?.name || "User"}</span>
                  )}
                  <p className="gc-chat-text">{msg.content}</p>
                  <span className="gc-chat-time">{formatTime(msg.createdAt)}</span>
                </div>
              );
            })()
          )
        )}

        {typingUsers.length > 0 && (
          <div className="gc-chat-typing">
            {typingUsers.map((u) => u.name).join(", ")}
            {typingUsers.length === 1 ? " is" : " are"} typing
            <span className="gc-chat-typing-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="gc-chat-input-bar">
        <textarea
          className="gc-chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="gc-chat-send"
          onClick={handleSend}
          disabled={!text.trim() || !connected}
          title="Send message"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default GroupChat;
