import { useState, useContext } from 'react';
import './Sidebar.css';
import { Context } from '../../context/Context';
import menuIcon from '../../assets/menu_icon.png';  // Adjust path if assets folder location differs

const Sidebar = () => {
  const {
    messages,
    chatIds,
    currentChatId,
    newChat,
    switchChat,
    deleteChat,
    extended,
    setExtended,
  } = useContext(Context);

  const [hovered, setHovered] = useState(false);

  const isExpanded = extended || hovered;

  const getChatTitle = (chatId) => {
    const firstMessage = (messages[chatId] || []).find((msg) => msg.role === 'user');
    if (!firstMessage) return `Chat ${chatId}`;
    const trimmedContent = firstMessage.content.trim();
    return trimmedContent.length >= 15
      ? trimmedContent.slice(0, 12) + '...'
      : trimmedContent;
  };
  // Reverse chatIds to show most recent first (assuming chatIds are in ascending/creation order)
  const reversedChatIds = [...chatIds].reverse();

  return (
    <div
      className="sidebar"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: isExpanded ? '250px' : '60px', transition: 'width 0.3s ease' }}
    >
      <div className="top">
        <img
          onClick={() => setExtended(!extended)}
          className="menu"
          src={menuIcon}
          alt="Toggle Sidebar"
        />
        <div onClick={() => { newChat(); setExtended(false); }} className="new-chat">
          <span>➕</span>
          {isExpanded ? <p>New Chat</p> : null}
        </div>
        {isExpanded ? (
          <div className="recent">
            <p className="recent-title">Recent Chats</p>
            {reversedChatIds.map((chatId) => (
              <div
                key={chatId}
                className="recent-entry"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <div
                  onClick={() => { switchChat(chatId); setExtended(false); }}
                  style={{ flex: 4, cursor: 'pointer' }}
                >
                  <p>{getChatTitle(chatId)}</p>
                </div>
                <div
                  onClick={(e) => { e.stopPropagation(); deleteChat(chatId); }}
                  className="delete-button"
                  style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <span>🗑</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      
    </div>
  );
};

export default Sidebar;