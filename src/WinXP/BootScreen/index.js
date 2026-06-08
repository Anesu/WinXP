import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';

import { preloadEmbeddedApps } from '../apps/EmbeddedApp/AppShell';
import windowsLogo from 'assets/windowsIcons/windows.png';

const BOOT_MESSAGES = [
  'Starting Windows...',
  'Preparing your desktop...',
  'Applying your personal settings...',
];

const MIN_BOOT_MS = 3000;

function BootScreen({ onComplete }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const startTime = Date.now();

    const messageTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % BOOT_MESSAGES.length);
    }, 1000);

    function finishBoot() {
      if (cancelled) return;
      setFadeOut(true);
      if (typeof window.v98PlaySound === 'function') {
        window.v98PlaySound('startup');
      }
      setTimeout(() => {
        if (!cancelled) onComplete();
      }, 650);
    }

    preloadEmbeddedApps()
      .then(() => {
        if (cancelled) return;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_BOOT_MS - elapsed);
        setTimeout(finishBoot, remaining + 500);
      })
      .catch(() => {
        if (!cancelled) finishBoot();
      });

    return () => {
      cancelled = true;
      clearInterval(messageTimer);
    };
  }, [onComplete]);

  return createPortal(
    <Container className={fadeOut ? 'fade-out' : ''}>
      <LogoBlock>
        <img src={windowsLogo} alt="" className="boot-flag" draggable={false} />
        <div className="boot-brand">
          <span className="boot-ms">
            Microsoft<sup>®</sup>
          </span>
          <span className="boot-windows">
            Windows<span className="boot-xp">XP</span>
          </span>
        </div>
      </LogoBlock>
      <BottomArea>
        <ProgressTrack>
          <ProgressBlocks />
        </ProgressTrack>
        <StatusText>{BOOT_MESSAGES[messageIndex]}</StatusText>
      </BottomArea>
    </Container>,
    document.body,
  );
}

const slide = keyframes`
  0% { transform: translateX(-48px); }
  100% { transform: translateX(220px); }
`;

const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: Tahoma, 'Segoe UI', sans-serif;
  transition: opacity 0.65s ease-out;
  cursor: default;

  &.fade-out {
    opacity: 0;
    pointer-events: none;
  }

  .boot-flag {
    width: 72px;
    height: 72px;
    margin-bottom: 14px;
    image-rendering: pixelated;
  }

  .boot-brand {
    text-align: center;
    color: #fff;
    line-height: 1.15;
  }

  .boot-ms {
    display: block;
    font-size: 15px;
    font-style: italic;
    font-weight: bold;
    letter-spacing: 0.5px;
    margin-bottom: 2px;

    sup {
      font-size: 8px;
      font-style: normal;
      vertical-align: super;
    }
  }

  .boot-windows {
    display: block;
    font-size: 30px;
    font-weight: bold;
    letter-spacing: -0.5px;
  }

  .boot-xp {
    font-weight: 300;
    margin-left: 2px;
  }
`;

const LogoBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80px;
`;

const BottomArea = styled.div`
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 240px;
`;

const ProgressTrack = styled.div`
  width: 200px;
  height: 14px;
  border: 1px solid #555;
  background: #1a1a1a;
  overflow: hidden;
  position: relative;
`;

const ProgressBlocks = styled.div`
  position: absolute;
  top: 2px;
  left: 0;
  width: 48px;
  height: 8px;
  display: flex;
  gap: 2px;
  animation: ${slide} 1.4s linear infinite;

  &::before,
  &::after {
    content: '';
    flex: 1;
    background: #3a6ea5;
  }

  background: #5b9bd5;
`;

const StatusText = styled.div`
  color: #b0b0b0;
  font-size: 11px;
  min-height: 14px;
  text-align: center;
`;

export default BootScreen;
