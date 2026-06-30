import { useState, useEffect, useRef, useCallback } from 'react';

export function useCall({ socket, localUserId, remoteUserId, userName }) {
  const [callState, setCallState] = useState('idle');
  const [isVideo, setIsVideo] = useState(true);
  const [isAudio, setIsAudio] = useState(true);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const callRef = useRef(null);
  const callStateRef = useRef('idle');

  const setState = (s) => { setCallState(s); callStateRef.current = s; };

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setRemoteStream(null);
    setState('idle');
    callRef.current = null;
  }, []);

  useEffect(() => {
    if (!localUserId) return;
    let peer;
    import('peerjs').then(mod => {
      const Peer = mod.default || mod;
      peer = new Peer(`user_${localUserId}`, { host: 'localhost', port: 3002, path: '/' });
      peer.on('open', () => { peerRef.current = peer; });
      peer.on('call', async (incomingCall) => {
        if (callStateRef.current !== 'idle') { incomingCall.close(); return; }
        setState('ringing');
        callRef.current = incomingCall;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
          incomingCall.answer(stream);
          incomingCall.on('stream', (remote) => {
            setRemoteStream(remote);
            setState('calling');
          });
          incomingCall.on('close', () => cleanup());
        } catch { cleanup(); }
      });
    });
    return () => { peer?.destroy(); cleanup(); };
  }, [localUserId, cleanup]);

  const startCall = useCallback(async (video = true) => {
    setIsVideo(video);
    setState('calling');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      localStreamRef.current = stream;
      const peer = peerRef.current;
      if (!peer) return;
      const target = remoteUserId ? `user_${remoteUserId}` : undefined;
      if (!target) return;
      const call = peer.call(target, stream);
      if (!call) return;
      callRef.current = call;
      call.on('stream', (remote) => {
        setRemoteStream(remote);
        setState('calling');
      });
      call.on('close', () => cleanup());
      socket?.emit('call:ring', { to: remoteUserId, from: localUserId, video });
    } catch { cleanup(); }
  }, [remoteUserId, socket, localUserId, cleanup]);

  const acceptCall = useCallback(() => {
    setState('calling');
  }, []);

  const endCall = useCallback(() => {
    socket?.emit('call:end', { to: remoteUserId, from: localUserId });
    cleanup();
  }, [remoteUserId, socket, localUserId, cleanup]);

  const toggleVideo = useCallback(() => {
    setIsVideo(prev => {
      const next = !prev;
      localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = next);
      return next;
    });
  }, []);

  const toggleAudio = useCallback(() => {
    setIsAudio(prev => {
      const next = !prev;
      localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = next);
      return next;
    });
  }, []);

  return { callState, isVideo, isAudio, remoteStream, startCall, acceptCall, endCall, toggleVideo, toggleAudio, localStream: localStreamRef.current };
}
