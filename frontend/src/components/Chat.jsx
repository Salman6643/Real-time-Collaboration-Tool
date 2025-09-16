import React, { useEffect, useState, useRef } from 'react';

export default function Chat({ socket }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on('chat-message', onMsg);
    return () => socket.off('chat-message', onMsg);
  }, [socket]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    socket.emit('chat-message', text);
    setText('');
  };

  return (
    <div className="chat">
      <h3>Chat</h3>
      <div className="messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className="message"><strong>{m.from}:</strong> {m.text}</div>
        ))}
      </div>
      <div className="send">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message" />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
