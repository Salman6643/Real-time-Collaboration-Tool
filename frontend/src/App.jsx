import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Whiteboard from './components/Whiteboard';
import Chat from './components/Chat';

// Set backend URL through Vite env or default localhost
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    }
  }, [socket]);

  const joinRoom = () => {
    if (!roomId) {
      alert('Enter room id');
      return;
    }
    const s = io(SERVER_URL, { transports: ['websocket'] });
    setSocket(s);
    s.on('connect', () => {
      s.emit('join-room', { roomId, userName });
      setJoined(true);
    });
  };

  return (
    <div className="app">
      {!joined ? (
        <div className="join">
          <h2>Real-time Whiteboard</h2>
          <input placeholder="Your name" value={userName} onChange={e => setUserName(e.target.value)} />
          <input placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} />
          <div className="buttons">
            <button onClick={joinRoom}>Join Room</button>
            <button onClick={() => { const id = Math.random().toString(36).slice(2,9); setRoomId(id); }}>Create New Room</button>
          </div>
        </div>
      ) : (
        <div className="workspace">
          <Whiteboard socket={socket} roomId={roomId} />
          <Chat socket={socket} />
        </div>
      )}
    </div>
  );
}







