import { useRef, useEffect, useState, useCallback } from 'react';

const COLORS = ['#2c2a4a', '#ff6b4a', '#ffc93c', '#6fb98f', '#4a90e2', '#ff9ec4'];
const WIDTH = 560;
const HEIGHT = 380;

export default function DrawingCanvas({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(4);
  const [eraser, setEraser] = useState(false);
  const loadedValue = useRef(null);

  // load initial drawing once (or when switching to a panel with different saved content)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (value && value !== loadedValue.current) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
      img.src = value;
    }
    loadedValue.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === loadedValue.current ? 'skip' : value]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * WIDTH,
      y: ((clientY - rect.top) / rect.height) * HEIGHT,
    };
  };

  const start = (e) => {
    drawing.current = true;
    last.current = getPos(e);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.strokeStyle = eraser ? '#ffffff' : color;
    ctx.lineWidth = eraser ? lineWidth * 4 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
  };

  const end = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    loadedValue.current = dataUrl;
    onChange(dataUrl);
  }, [onChange]);

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    loadedValue.current = dataUrl;
    onChange(dataUrl);
  };

  return (
    <div className="drawing-canvas">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={end}
      />
      <div className="canvas-toolbar">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`swatch ${!eraser && color === c ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => {
              setColor(c);
              setEraser(false);
            }}
            aria-label={`색상 ${c}`}
          />
        ))}
        <button className={`btn btn-ghost small ${eraser ? 'active' : ''}`} onClick={() => setEraser(true)}>
          지우개
        </button>
        <select value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))}>
          <option value={2}>가는 선</option>
          <option value={4}>보통 선</option>
          <option value={8}>굵은 선</option>
        </select>
        <button className="btn btn-ghost small" onClick={clear}>
          전체 지우기
        </button>
      </div>
    </div>
  );
}
