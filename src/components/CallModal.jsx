import { useEffect, useRef } from 'react';

export default function CallModal({ callState, isVideo, isAudio, remoteStream, localStream, onAccept, onEnd, onToggleVideo, onToggleAudio, userName, incoming }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div className="call-overlay">
      <div className="call-container">
        {callState === 'ringing' && incoming && (
          <div className="call-info">
            <div className="call-avatar">{userName?.[0]}</div>
            <div className="call-name">{userName}</div>
            <div className="call-status">Входящий звонок...</div>
            <div className="call-actions">
              <button className="call-btn call-btn-accept" onClick={onAccept}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              </button>
              <button className="call-btn call-btn-end" onClick={onEnd}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>
        )}

        {callState === 'calling' && (
          <>
            <div className="call-video-container">
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="call-video-remote" />
              ) : (
                <div className="call-info">
                  <div className="call-avatar">{userName?.[0]}</div>
                  <div className="call-name">{userName}</div>
                  <div className="call-status">Соединение...</div>
                </div>
              )}
              {localStream && (
                <video ref={localVideoRef} autoPlay playsInline muted className="call-video-local" />
              )}
            </div>
            <div className="call-controls">
              <button className={`call-ctrl ${!isAudio ? 'muted' : ''}`} onClick={onToggleAudio}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
              <button className="call-ctrl call-ctrl-end" onClick={onEnd}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <button className={`call-ctrl ${!isVideo ? 'muted' : ''}`} onClick={onToggleVideo}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
