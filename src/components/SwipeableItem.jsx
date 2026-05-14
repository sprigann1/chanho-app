import React, { useRef, useState } from 'react';

const DELETE_WIDTH = 76;

export default function SwipeableItem({ onDelete, children }) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const direction = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startOffset.current = offsetX;
    direction.current = null;
    setDragging(true);
  };

  const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (direction.current === null) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      direction.current = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    }
    if (direction.current !== 'h') return;
    e.preventDefault();
    setOffsetX(Math.max(-DELETE_WIDTH, Math.min(0, startOffset.current + dx)));
  };

  const handleTouchEnd = () => {
    if (direction.current === 'h') {
      setOffsetX(offsetX < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0);
    }
    setDragging(false);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_WIDTH,
        background: 'var(--red)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <button
          onClick={() => { setOffsetX(0); onDelete(); }}
          style={{ color: '#fff', fontSize: 13, fontWeight: 700, width: '100%', height: '100%' }}
        >
          삭제
        </button>
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (offsetX !== 0) setOffsetX(0); }}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging ? 'none' : 'transform 0.22s ease',
          position: 'relative', zIndex: 1,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
