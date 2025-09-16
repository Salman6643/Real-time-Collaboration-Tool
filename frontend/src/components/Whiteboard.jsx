import React, { useRef, useEffect, useState } from 'react';

export default function Whiteboard({ socket, roomId }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef({x:0,y:0});
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 900;
    canvas.height = 600;
    canvas.style.border = '1px solid #ddd';
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineWidth = size;
    ctxRef.current = ctx;

    if (!socket) return;
    const onDrawing = (data) => {
      const { start, end, color: c, size: s } = data;
      if (!ctxRef.current) return;
      ctxRef.current.strokeStyle = c;
      ctxRef.current.lineWidth = s;
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(start.x, start.y);
      ctxRef.current.lineTo(end.x, end.y);
      ctxRef.current.stroke();
    };

    const onClear = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
    };

    socket.on('drawing', onDrawing);
    socket.on('clear-canvas', onClear);

    return () => {
      socket.off('drawing', onDrawing);
      socket.off('clear-canvas', onClear);
    };
  }, [socket, size]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e) => {
    drawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(pos.x, pos.y);
    socket && socket.emit('cursor-move', { x: pos.x, y: pos.y });
  };

  const move = (e) => {
    if (!drawing.current) return;
    const pos = getPos(e);
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = size;
    ctxRef.current.lineTo(pos.x, pos.y);
    ctxRef.current.stroke();

    const data = { start: lastPos.current, end: pos, color, size };
    socket && socket.emit('drawing', data);
    lastPos.current = pos;
  };

  const end = () => {
    drawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket && socket.emit('clear-canvas');
  };

  return (
    <div className="whiteboard">
      <div className="controls">
        <label>Color: <input type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
        <label>Brush: <input type="range" min={1} max={30} value={size} onChange={e => setSize(Number(e.target.value))} /></label>
        <button onClick={clearCanvas}>Clear</button>
      </div>
      <canvas ref={canvasRef}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
      />
    </div>
  );
}
