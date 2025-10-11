import { useContext, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Main.css';
import { Context } from '../../context/Context';

const Main = () => {
  const { messages, currentChatId, input, setInput, onSent, loading, error } = useContext(Context);
  const textareaRef = useRef(null);
  const mainBottomRef = useRef(null);
  const mainRef = useRef(null);
  const mainContainerRef = useRef(null);
  const resultRef = useRef(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const updatePadding = () => {
    const mainBottom = mainBottomRef.current;
    const main = mainRef.current;
    const mainContainer = mainContainerRef.current;
    if (mainBottom && main && mainContainer) {
      const bottomHeight = mainBottom.clientHeight;
      main.style.paddingBottom = `${bottomHeight + 20}px`; // Extra buffer to prevent overlap
      mainContainer.style.height = `calc(100% - ${bottomHeight + 20}px)`;
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (loading) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        setInput((prev) => prev + '\n');
      } else {
        if (input.trim() !== '') {
          onSent();
        }
      }
    }
  };

  // Function to safely parse JSON response and extract content
  const extractMessageContent = (rawContent) => {
    if (typeof rawContent !== 'string') return rawContent;

    try {
      // Check if it looks like a JSON object with 'response' key
      const jsonMatch = rawContent.match(/^\s*\{\s*"response"\s*:\s*"([^"]+)"\s*\}\s*$/);
      if (jsonMatch) {
        return jsonMatch[1];
      }

      // More flexible: parse the entire string as JSON if possible
      const parsed = JSON.parse(rawContent);
      if (parsed && typeof parsed.response === 'string') {
        return parsed.response;
      }
    } catch (e) {
      // If parsing fails, return original
    }

    return rawContent;
  };

  // Function to parse backend response and render formatted content
  const renderMessageContent = (content) => {
    // Extract actual message if wrapped in JSON
    const extractedContent = extractMessageContent(content);

    // Unescape literal \\n (and optionally \\t, \\r) from backend JSON
    let unescapedContent = extractedContent
    .replace(/\\n/g, '\n')  // Convert \\n to actual \n
    .replace(/\\t/g, '\t')  // Tabs (optional)
    .replace(/\\r/g, '\r'); // Carriage returns (optional)
  
  // Collapse 3+ consecutive newlines down to exactly 2 (prevent huge gaps)
  // and trim leading/trailing whitespace/newlines:
    unescapedContent = unescapedContent.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
  
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Optional: Customize components for styling (e.g., tables, lists)
          table: ({ children }) => (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', margin: '1em 0' }}>{children}</table>
            </div>
          ),
          th: ({ children }) => <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f5f5f5' }}>{children}</th>,
          td: ({ children }) => <td style={{ border: '1px solid #ddd', padding: '8px' }}>{children}</td>,
          ul: ({ children }) => <ul style={{ paddingLeft: '20px', margin: '0.5em 0' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: '20px', margin: '0.5em 0' }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: '0.5em' }}>{children}</li>,
          p: ({ children }) => <p style={{ margin: '0.5em 0', lineHeight: '1.6' }}>{children}</p>,
          strong: ({ children }) => <strong style={{ fontWeight: 'bold' }}>{children}</strong>,
          code: ({ children }) => <code style={{ backgroundColor: '#f0f0f0', padding: '2px 4px', borderRadius: '3px' }}>{children}</code>,
        }}
      >
        {unescapedContent}
      </ReactMarkdown>
    );
  };

  useEffect(() => {
    resizeTextarea();
    updatePadding();
  }, [input]);

  useEffect(() => {
    updatePadding();
    // Scroll to bottom only when the latest message is from the user
    if (resultRef.current) {
      const chatMessages = messages[currentChatId] || [];
      if (chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'user') {
        resultRef.current.scrollTop = resultRef.current.scrollHeight;
      }
    }
  }, [messages, loading, error, currentChatId]);

  // Update on window resize
  useEffect(() => {
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);

  const chatMessages = messages[currentChatId] || [];
  const isEmpty = chatMessages.length === 0 && !loading && !error;

  return (
    <div className="main" ref={mainRef}>
      {!isEmpty && (
        <div className="nav">
          <p>Chat</p>
        </div>
      )}
      <div className="main-container" ref={mainContainerRef}>
        <div className="result" ref={resultRef} style={{ padding: '20px' }}>
          {isEmpty ? (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="welcome-message">
                Accounting Buddy
              </div>
            </div>
          ) : (
            <>
              {error && <p style={{ color: 'red' }}>{error}</p>}
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-container ${msg.role === 'user' ? 'user' : 'assistant'}`}
                  style={{
                    margin: '6px 20%', // smaller vertical spacing (was '1% 20%')
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    flexDirection: 'row',
                  }}
                  
                >
                  <div
                    className="message-bubble"
                    style={{
                      maxWidth: '95%',
                      padding: '0px 17px',
                      borderRadius: '20px',
                      backgroundColor: msg.role === 'assistant' ? '#ffffff' : '#f0f0f0',
                      color: '#000000',
                      wordWrap: 'break-word',
                    }}
                  >
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid #f0f0f0',
                      borderTop: '3px solid #000000',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <style>
                    {`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}
                  </style>
                </div>
              )}
            </>
          )}
        </div>
        <div className="main-bottom" ref={mainBottomRef}>
          <div className="search-box">
            <textarea
              ref={textareaRef}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
              value={input}
              placeholder="Type your message..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '10px', fontSize: '16px' }}
            />
            <div>
              {input.trim() && !loading && <span onClick={() => onSent()} style={{ cursor: 'pointer', marginLeft: '10px' }}>➜</span>}
            </div>
          </div>
          <p className="bottom-info">
            This app may provide inaccurate info; verify responses. Your privacy matters.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;