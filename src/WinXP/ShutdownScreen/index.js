import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { css, keyframes } from 'styled-components';

const SHADE_MS = 1400;
const WAKE_MS = 600;

const shadeToBlack = keyframes`
  0% {
    background-color: rgba(128, 128, 128, 0.2);
  }
  45% {
    background-color: rgba(96, 96, 96, 0.72);
  }
  100% {
    background-color: #000;
  }
`;

const wakeFromBlack = keyframes`
  from {
    background-color: #000;
  }
  to {
    background-color: transparent;
  }
`;

function ShutdownScreen({ onWake }) {
  const [phase, setPhase] = useState('shading');

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase('off'), SHADE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function handleWake() {
    if (phase !== 'off') return;
    setPhase('waking');
    window.setTimeout(() => {
      if (typeof onWake === 'function') onWake();
    }, WAKE_MS);
  }

  return createPortal(
    <Overlay
      $phase={phase}
      role="presentation"
      aria-hidden={phase !== 'off'}
      onClick={handleWake}
      onMouseDown={(e) => e.preventDefault()}
    />,
    document.body,
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200000;
  cursor: default;
  touch-action: manipulation;
  background-color: ${({ $phase }) =>
    $phase === 'off' || $phase === 'waking' ? '#000' : 'rgba(128, 128, 128, 0.2)'};

  ${({ $phase }) =>
    $phase === 'shading' &&
    css`
      animation: ${shadeToBlack} ${SHADE_MS}ms ease-in forwards;
    `}

  ${({ $phase }) =>
    $phase === 'waking' &&
    css`
      animation: ${wakeFromBlack} ${WAKE_MS}ms ease-out forwards;
      pointer-events: none;
    `}
`;

export default ShutdownScreen;