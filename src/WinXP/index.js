import React, { useRef, useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import useMouse from 'react-use/lib/useMouse';

import { FOCUSING, POWER_STATE } from './constants';
import {
  wireShellBridge,
  subscribeShellEvent,
  ShellEvents,
} from './apps/EmbeddedApp/shellBridge';
import BootScreen from './BootScreen';
import ShutdownScreen from './ShutdownScreen';
import DesktopContextMenu from './DesktopContextMenu';
import Modal from './Modal';
import Footer from './Footer';
import Windows from './Windows';
import Icons from './Icons';
import { DashedBox } from 'components';
import { useDesktopState } from './state/useDesktopState';

function WinXP() {
  const [contextMenu, setContextMenu] = useState(null);
  const ref = useRef(null);
  const mouse = useMouse(ref);

  const {
    state,
    focusedAppId,
    onFocusApp,
    onMaximizeWindow,
    onMinimizeWindow,
    onCloseApp,
    onMouseDownFooterApp,
    onMouseDownIcon,
    onDoubleClickIcon,
    onMouseDownFooter,
    openEmbeddedApp,
    onClickMenuItem,
    onDesktopMenuAction,
    onClickModalButton,
    onModalClose,
    onBootComplete,
    onShutdownWake,
    onStartSelect,
    onEndSelect,
    onIconsSelected,
    focusDesktop,
    triggerPowerOff,
  } = useDesktopState();

  useEffect(() => {
    if (state.powerState === POWER_STATE.BOOTING) return;
    wireShellBridge(openEmbeddedApp);
    const unsubPowerOff = subscribeShellEvent(
      ShellEvents.POWER_OFF,
      (detail) => {
        const mode =
          detail && detail.mode === 'LOG_OFF'
            ? POWER_STATE.LOG_OFF
            : POWER_STATE.TURN_OFF;
        triggerPowerOff(mode);
      },
    );
    return () => {
      unsubPowerOff();
      if (window.ShellAPI) window.ShellAPI.registerShell(null);
    };
  }, [state.powerState, openEmbeddedApp, triggerPowerOff]);

  function onMouseDownDesktop(e) {
    if (e.target === e.currentTarget)
      onStartSelect({ x: mouse.docX, y: mouse.docY });
  }

  function onContextMenuDesktop(e) {
    e.preventDefault();
    if (e.target !== e.currentTarget) return;
    focusDesktop();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function onMouseUpDesktop(e) {
    onEndSelect();
  }

  return (
    <>
      {state.powerState === POWER_STATE.BOOTING && (
        <BootScreen onComplete={onBootComplete} />
      )}
      {state.powerState === POWER_STATE.SHUTDOWN && (
        <ShutdownScreen onWake={onShutdownWake} />
      )}
      {contextMenu && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAction={onDesktopMenuAction}
        />
      )}
      <Container
        ref={ref}
        onMouseUp={onMouseUpDesktop}
        onMouseDown={onMouseDownDesktop}
        onContextMenu={onContextMenuDesktop}
        state={state.powerState}
        $booted={state.powerState !== POWER_STATE.BOOTING}
      >
        <Icons
          icons={state.icons}
          onMouseDown={onMouseDownIcon}
          onDoubleClick={onDoubleClickIcon}
          displayFocus={state.focusing === FOCUSING.ICON}
          mouse={mouse}
          selecting={state.selecting}
          setSelectedIcons={onIconsSelected}
        />
        <DashedBox startPos={state.selecting} mouse={mouse} />
        <Windows
          apps={state.apps}
          onMouseDown={onFocusApp}
          onClose={onCloseApp}
          onMinimize={onMinimizeWindow}
          onMaximize={onMaximizeWindow}
          focusedAppId={focusedAppId}
        />
        <Footer
          apps={state.apps}
          onMouseDownApp={onMouseDownFooterApp}
          focusedAppId={focusedAppId}
          onMouseDown={onMouseDownFooter}
          onClickMenuItem={onClickMenuItem}
          onPomodoroClick={() => {
            const pomodoroWin = state.apps.find(
              (app) => app.header.title === 'Pomodoro Timer' && !app.minimized,
            );
            if (pomodoroWin) {
              onFocusApp(pomodoroWin.id);
            } else {
              openEmbeddedApp('pomodoro');
            }
          }}
        />
        {state.powerState === POWER_STATE.TURN_OFF ||
        state.powerState === POWER_STATE.LOG_OFF ? (
          <Modal
            onClose={onModalClose}
            onClickButton={onClickModalButton}
            mode={state.powerState}
          />
        ) : null}
      </Container>
    </>
  );
}

const powerOffAnimation = keyframes`
  0% {
    filter: brightness(1) grayscale(0);
  }
  30% {
    filter: brightness(1) grayscale(0);
  }
  100% {
    filter: brightness(0.6) grayscale(1);
  }
`;
const animation = {
  [POWER_STATE.BOOTING]: '',
  [POWER_STATE.START]: '',
  [POWER_STATE.TURN_OFF]: powerOffAnimation,
  [POWER_STATE.LOG_OFF]: powerOffAnimation,
  [POWER_STATE.SHUTDOWN]: powerOffAnimation,
};

const Container = styled.div`
  @import url('https://fonts.googleapis.com/css?family=Noto+Sans');
  font-family: Tahoma, 'Noto Sans', sans-serif;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: url(https://i.imgur.com/Zk6TR5k.jpg) no-repeat center center fixed;
  background-size: cover;
  opacity: ${({ $booted }) => ($booted ? 1 : 0)};
  transition: opacity 0.4s ease-in;
  animation: ${({ state }) => animation[state]} 5s forwards;
  *:not(input):not(textarea) {
    user-select: none;
  }
`;

export default WinXP;
