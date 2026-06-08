import { useEffect, useState } from 'react';

function useElementResize(ref, options) {
  const {
    defaultOffset,
    defaultSize,
    boundary,
    resizable = true,
    resizeThreshold = 10,
    constraintSize = 200,
  } = options;
  const [offset, setOffset] = useState(defaultOffset);
  const [size, setSize] = useState(defaultSize);
  const cursorPos = useCursor(ref, resizeThreshold, resizable);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const dragTarget = options.dragRef && options.dragRef.current;
    const cover = document.createElement('div');
    cover.style.position = 'fixed';
    cover.style.top = 0;
    cover.style.left = 0;
    cover.style.right = 0;
    cover.style.bottom = 0;

    let previousOffset = { ...offset };
    let previousSize = { ...size };
    let _boundary;
    let originMouseX;
    let originMouseY;
    let mode = null;
    let shouldCover = false;

    function onDragging(e) {
      if (shouldCover && !document.body.contains(cover)) {
        document.body.appendChild(cover);
      }
      const { pageX, pageY } = getComputedPagePosition(e, _boundary);
      const deltaX = pageX - originMouseX;
      const deltaY = pageY - originMouseY;

      if (mode === 'drag') {
        setOffset({
          x: previousOffset.x + deltaX,
          y: previousOffset.y + deltaY,
        });
        return;
      }

      let newWidth = previousSize.width;
      let newHeight = previousSize.height;
      let newX = previousOffset.x;
      let newY = previousOffset.y;

      const lowerMode = mode.toLowerCase();

      if (lowerMode.includes('right')) {
        newWidth = previousSize.width + deltaX;
      } else if (lowerMode.includes('left')) {
        newWidth = previousSize.width - deltaX;
        newX = previousOffset.x + deltaX;
      }

      if (lowerMode.includes('bottom')) {
        newHeight = previousSize.height + deltaY;
      } else if (lowerMode.includes('top')) {
        newHeight = previousSize.height - deltaY;
        newY = previousOffset.y + deltaY;
      }

      setSize({ width: newWidth, height: newHeight });

      if (lowerMode.includes('left') || lowerMode.includes('top')) {
        setOffset({ x: newX, y: newY });
      }
    }

    function onDragEnd(e) {
      cover.remove();
      shouldCover = false;
      const { pageX, pageY } = getComputedPagePosition(e, _boundary);
      const deltaX = pageX - originMouseX;
      const deltaY = pageY - originMouseY;

      if (mode === 'drag') {
        previousOffset.x += deltaX;
        previousOffset.y += deltaY;
      } else {
        const lowerMode = mode.toLowerCase();
        if (lowerMode.includes('right')) {
          previousSize.width += deltaX;
        } else if (lowerMode.includes('left')) {
          previousSize.width -= deltaX;
          previousOffset.x += deltaX;
        }

        if (lowerMode.includes('bottom')) {
          previousSize.height += deltaY;
        } else if (lowerMode.includes('top')) {
          previousSize.height -= deltaY;
          previousOffset.y += deltaY;
        }
      }

      window.removeEventListener('mousemove', onDragging);
      window.removeEventListener('mouseup', onDragEnd);
      mode = null;
    }

    function onMouseDown(e) {
      originMouseX = e.pageX;
      originMouseY = e.pageY;
      _boundary = { ...boundary };

      if (dragTarget && e.target === dragTarget) {
        shouldCover = true;
        mode = 'drag';
        window.addEventListener('mousemove', onDragging);
        window.addEventListener('mouseup', onDragEnd);
        return;
      }

      if (e.target !== target || !resizable || !cursorPos) return;

      mode = cursorPos;
      const lowerMode = mode.toLowerCase();

      if (lowerMode.includes('left')) {
        _boundary.right = originMouseX + previousSize.width - constraintSize;
      } else if (lowerMode.includes('right')) {
        _boundary.left = originMouseX - previousSize.width + constraintSize;
      }

      if (lowerMode.includes('top')) {
        _boundary.bottom = originMouseY + previousSize.height - constraintSize;
      } else if (lowerMode.includes('bottom')) {
        _boundary.top = originMouseY - previousSize.height + constraintSize;
      }

      window.addEventListener('mousemove', onDragging);
      window.addEventListener('mouseup', onDragEnd);
    }

    target.addEventListener('mousedown', onMouseDown);
    return () => {
      target.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onDragging);
      window.removeEventListener('mouseup', onDragEnd);
      cover.remove();
    };
    // eslint-disable-next-line
  }, [boundary.top, boundary.right, boundary.bottom, boundary.left, cursorPos]);

  return { offset, size };
}
function useCursor(ref, threshold, resizable) {
  const [position, setPosition] = useState('');
  useEffect(() => {
    const target = ref.current;
    if (!target || !resizable) return;
    const cover = document.createElement('div');
    cover.style.position = 'fixed';
    cover.style.top = 0;
    cover.style.left = 0;
    cover.style.right = 0;
    cover.style.bottom = 0;
    let lock = false;
    function _setPosition(p) {
      setPosition(p);
      target.style.cursor = getCursorStyle(p);
      cover.style.cursor = getCursorStyle(p);
    }
    function onMouseDown(e) {
      if (e.target !== target) return;
      onHover(e);
      lock = true;
      document.body.appendChild(cover);
      window.addEventListener('mouseup', onMouseUp);
    }
    function onMouseUp(e) {
      lock = false;
      cover.remove();
      window.removeEventListener('mouseup', onMouseUp);
    }
    function onHoverEnd(e) {
      if (lock) return;
      _setPosition('');
    }
    function onHover(e) {
      if (lock) return;
      if (e.target !== target) return _setPosition('');
      const { offsetX, offsetY } = e;
      const { width, height } = target.getBoundingClientRect();
      if (offsetX < threshold) {
        if (offsetY < threshold) {
          _setPosition('topLeft');
        } else if (height - offsetY < threshold) {
          _setPosition('bottomLeft');
        } else {
          _setPosition('left');
        }
      } else if (offsetY < threshold) {
        if (width - offsetX < threshold) {
          _setPosition('topRight');
        } else {
          _setPosition('top');
        }
      } else if (width - offsetX < threshold) {
        if (height - offsetY < threshold) _setPosition('bottomRight');
        else _setPosition('right');
      } else if (height - offsetY < threshold) {
        _setPosition('bottom');
      } else {
        _setPosition('');
      }
    }
    target.addEventListener('mouseleave', onHoverEnd);
    target.addEventListener('mousemove', onHover);
    target.addEventListener('mousedown', onMouseDown);
    return () => {
      cover.remove();
      target.removeEventListener('mouseleave', onHoverEnd);
      target.removeEventListener('mousemove', onHover);
      target.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
    // eslint-disable-next-line
  }, []);
  return position;
}

function getComputedPagePosition(e, boundary) {
  let { pageX, pageY } = e;
  if (!boundary) return { pageX, pageY };
  const { top, right, bottom, left } = boundary;
  if (pageX <= left) pageX = left;
  else if (pageX >= right) pageX = right;
  if (pageY <= top) pageY = top;
  else if (pageY >= bottom) pageY = bottom;
  return { pageX, pageY };
}
function getCursorStyle(pos) {
  switch (pos) {
    case 'top':
      return 'n-resize';
    case 'topRight':
      return 'ne-resize';
    case 'right':
      return 'e-resize';
    case 'bottomRight':
      return 'se-resize';
    case 'bottom':
      return 's-resize';
    case 'bottomLeft':
      return 'sw-resize';
    case 'left':
      return 'w-resize';
    case 'topLeft':
      return 'nw-resize';
    default:
      return 'auto';
  }
}
export default useElementResize;
