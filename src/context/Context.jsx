import { createContext, useState, useEffect } from "react";

export const Context = createContext();

const ContextProvider = (props) => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("messages");
    return saved ? JSON.parse(saved) : {};
  });
  const [chatIds, setChatIds] = useState(() => {
    const saved = localStorage.getItem("chatIds");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentChatId, setCurrentChatId] = useState(() => {
    const saved = localStorage.getItem("currentChatId");
    return saved ? parseInt(saved) : 1;
  });
  const [nextChatId, setNextChatId] = useState(() => {
    const saved = localStorage.getItem("nextChatId");
    if (saved) return parseInt(saved);
    // If not saved, calculate from existing chatIds
    const existingIds = localStorage.getItem("chatIds");
    if (existingIds) {
      const ids = JSON.parse(existingIds);
      return ids.length > 0 ? Math.max(...ids) + 1 : 1;
    }
    return 1;
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId] = useState(Date.now().toString());
  const [extended, setExtended] = useState(false);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
    localStorage.setItem("chatIds", JSON.stringify(chatIds));
    localStorage.setItem("currentChatId", currentChatId.toString());
    localStorage.setItem("nextChatId", nextChatId.toString());
  }, [messages, chatIds, currentChatId, nextChatId]);

  const onSent = async (prompt) => {
    setError("");
    setLoading(true);

    if (!messages[currentChatId]) {
      setMessages((prev) => ({
        ...prev,
        [currentChatId]: [],
      }));
      // Only add to chatIds if it's not already there
      setChatIds((prev) => {
        if (!prev.includes(currentChatId)) {
          return [...prev, currentChatId];
        }
        return prev;
      });
    }

    const userMessage = { role: "user", content: prompt || input };
    setMessages((prev) => ({
      ...prev,
      [currentChatId]: [...(prev[currentChatId] || []), userMessage],
    }));

    try {
      const response = await fetch("https://cabuddybackend.onrender.com/caBuddy/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt || input,
          session_id: `${sessionId}${currentChatId}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const textResponse = await response.text();
      setMessages((prev) => ({
        ...prev,
        [currentChatId]: [
          ...(prev[currentChatId] || []),
          { role: "assistant", content: textResponse },
        ],
      }));
    } catch (err) {
      setError(`Error: ${err.message}`);
    }

    setLoading(false);
    setInput("");
  };

  const deleteChat = async (chatId) => {
    try {
      const response = await fetch("https://cabuddybackend.onrender.com/deleteChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: `${sessionId}${chatId}` }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      setMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages[chatId];
        return newMessages;
      });
      setChatIds((prev) => prev.filter((id) => id !== chatId));
      if (currentChatId === chatId) {
        // If we're deleting the current chat, switch to another chat or create new
        const remainingChats = chatIds.filter((id) => id !== chatId);
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[remainingChats.length - 1]); // Switch to most recent
        } else {
          // No chats left, create a new one
          setCurrentChatId(nextChatId);
          setNextChatId((prev) => prev + 1);
        }
      }
    } catch (err) {
      setError(`Error deleting chat: ${err.message}`);
    }
  };

  const newChat = () => {
    setLoading(false);
    setError("");
    // Use the nextChatId to ensure we always get a unique new ID
    setCurrentChatId(nextChatId);
    setNextChatId((prev) => prev + 1);
  };

  const switchChat = (chatId) => {
    setCurrentChatId(chatId);
    setError("");
  };

  const contextValue = {
    messages,
    chatIds,
    currentChatId,
    input,
    setInput,
    loading,
    error,
    onSent,
    newChat,
    deleteChat,
    switchChat,
    extended,
    setExtended,
  };

  return <Context.Provider value={contextValue}>{props.children}</Context.Provider>;
};

export default ContextProvider;
