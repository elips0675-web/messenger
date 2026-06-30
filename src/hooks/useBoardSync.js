import { useEffect, useCallback } from 'react';

export function useBoardSync(socket, boardId) {
  useEffect(() => {
    if (!socket || !boardId) return;
    socket.emit('board:join', boardId);
    return () => {
      socket.emit('board:leave', boardId);
    };
  }, [socket, boardId]);

  const onDraw = useCallback((cb) => {
    if (!socket) return;
    const handler = (data) => cb(data);
    socket.on('board:draw', handler);
    return () => socket.off('board:draw', handler);
  }, [socket]);

  const onClear = useCallback((cb) => {
    if (!socket) return;
    const handler = () => cb();
    socket.on('board:clear', handler);
    return () => socket.off('board:clear', handler);
  }, [socket]);

  const emitDraw = useCallback((data) => {
    socket?.emit('board:draw', { boardId, ...data });
  }, [socket, boardId]);

  const emitClear = useCallback(() => {
    socket?.emit('board:clear', { boardId });
  }, [socket, boardId]);

  return { onDraw, onClear, emitDraw, emitClear };
}
