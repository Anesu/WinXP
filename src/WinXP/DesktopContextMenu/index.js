import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const MENU_ITEMS = [
  {
    type: 'menu',
    text: 'Arrange Icons By',
    items: [
      { type: 'item', text: 'Name', action: 'arrange-name' },
      { type: 'item', text: 'Size', disabled: true },
      { type: 'item', text: 'Type', disabled: true },
      { type: 'item', text: 'Modified', disabled: true },
    ],
  },
  { type: 'item', text: 'Refresh', action: 'refresh' },
  { type: 'separator' },
  { type: 'item', text: 'Paste', disabled: true },
  { type: 'item', text: 'Paste Shortcut', disabled: true },
  { type: 'separator' },
  {
    type: 'menu',
    text: 'New',
    items: [
      { type: 'item', text: 'Shortcut', disabled: true },
      { type: 'separator' },
      { type: 'item', text: 'Notepad', action: 'new-notepad' },
      { type: 'item', text: 'Bitmap Image', action: 'new-paint' },
      { type: 'item', text: 'Internet Explorer', action: 'new-ie' },
    ],
  },
  { type: 'separator' },
  { type: 'item', text: 'Properties', action: 'properties' },
];

const ACTION_BY_LABEL = MENU_ITEMS.reduce((map, item) => {
  if (item.action) map[item.text] = item.action;
  if (item.items) {
    item.items.forEach((sub) => {
      if (sub.action && !sub.disabled) map[sub.text] = sub.action;
    });
  }
  return map;
}, {});

function DesktopContextMenu({ x, y, onClose, onAction }) {
  const menuRef = useRef(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const pos = clampPosition(x, y);

  useEffect(() => {
    function onPointerDown(e) {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      onClose();
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  function onMenuClick(label) {
    const action = ACTION_BY_LABEL[label];
    if (!action) return;
    onAction(action);
    onClose();
  }

  function openSubmenu(text) {
    setActiveSubmenu(text);
  }

  return createPortal(
    <Menu
      ref={menuRef}
      className="desktop-context-menu"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {MENU_ITEMS.map((item, index) => (
        <MenuRow
          key={item.text || `sep-${index}`}
          item={item}
          submenuOpen={activeSubmenu === item.text}
          onOpenSubmenu={openSubmenu}
          onCloseSubmenu={() => setActiveSubmenu(null)}
          onClick={onMenuClick}
        />
      ))}
    </Menu>,
    document.body,
  );
}

function MenuRow({
  item,
  submenuOpen,
  onOpenSubmenu,
  onCloseSubmenu,
  onClick,
  nested,
}) {
  if (item.type === 'separator') {
    return <hr className="menu-separator" />;
  }

  if (item.type === 'menu') {
    return (
      <div
        className={`menu-item submenu-parent${submenuOpen ? ' open' : ''}`}
        onMouseEnter={() => onOpenSubmenu(item.text)}
        onClick={(e) => {
          e.stopPropagation();
          onOpenSubmenu(item.text);
        }}
      >
        <span className="menu-label">{item.text}</span>
        <span className="menu-arrow" />
        {submenuOpen && (
          <SubMenuPanel
            className="desktop-context-menu"
            onMouseEnter={() => onOpenSubmenu(item.text)}
          >
            {item.items.map((sub, subIndex) => (
              <MenuRow
                key={sub.text || `sub-sep-${subIndex}`}
                item={sub}
                submenuOpen={false}
                onOpenSubmenu={onOpenSubmenu}
                onCloseSubmenu={onCloseSubmenu}
                onClick={onClick}
                nested
              />
            ))}
          </SubMenuPanel>
        )}
      </div>
    );
  }

  return (
    <div
      className={`menu-item${item.disabled ? ' disabled' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (item.disabled) return;
        onClick(item.text);
      }}
    >
      <span className="menu-label">{item.text}</span>
    </div>
  );
}

function clampPosition(x, y) {
  const width = 196;
  const height = 280;
  const margin = 8;
  return {
    x: Math.max(margin, Math.min(x, window.innerWidth - width - margin)),
    y: Math.max(margin, Math.min(y, window.innerHeight - height - margin)),
  };
}

const Menu = styled.div`
  position: fixed;
  z-index: 100000;
  min-width: 180px;
  padding: 2px 0;
  background: #fff;
  border: 1px solid #aca899;
  box-shadow: 2px 3px 6px rgba(0, 0, 0, 0.35);
  font-family: Tahoma, 'Segoe UI', sans-serif;
  font-size: 11px;
  color: #000;
  cursor: default;

  .menu-separator {
    border: none;
    border-top: 1px solid #aca899;
    border-bottom: 1px solid #fff;
    margin: 3px 2px;
    height: 0;
  }

  .menu-item {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 22px;
    padding: 2px 28px 2px 22px;
    white-space: nowrap;

    &.open,
    &:not(.disabled):hover {
      background: #316ac5;
      color: #fff;
    }

    &.disabled {
      color: #aca899;
      cursor: default;
    }

    &.open .menu-arrow::before,
    &:not(.disabled):hover .menu-arrow::before {
      border-left-color: #fff;
    }
  }

  .menu-label {
    flex: 1;
  }

  .menu-arrow {
    position: absolute;
    right: 8px;
    width: 0;
    height: 0;

    &::before {
      content: '';
      display: block;
      border: 4px solid transparent;
      border-right: 0;
      border-left-color: #000;
    }
  }
`;

const SubMenuPanel = styled.div`
  position: absolute;
  left: calc(100% - 3px);
  top: -2px;
  min-width: 160px;
  padding: 2px 0;
  background: #fff;
  border: 1px solid #aca899;
  box-shadow: 2px 3px 6px rgba(0, 0, 0, 0.35);
`;

export default DesktopContextMenu;
