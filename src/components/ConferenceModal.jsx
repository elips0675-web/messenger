import { useEffect, useRef } from 'react';

const JITSI_DOMAIN = 'meet.jit.si';

export default function ConferenceModal({ roomName, userName, onClose }) {
  const containerRef = useRef(null);
  const jitsiRef = useRef(null);
  const guestLink = `${window.location.origin}/join/${roomName}`;

  const copyLink = () => {
    navigator.clipboard.writeText(guestLink).then(() => alert('Ссылка скопирована: ' + guestLink));
  };

  useEffect(() => {
    if (!containerRef.current || jitsiRef.current) return;
    const domain = JITSI_DOMAIN;
    const options = {
      roomName: `CorpMessenger_${roomName}`,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      configOverrides: { startWithVideoMuted: false, disableDeepLinking: true },
      interfaceConfigOverrides: { TOOLBAR_ALWAYS_VISIBLE: false, SHOW_JITSI_WATERMARK: false, SHOW_WATERMARK_FOR_GUESTS: false },
      userInfo: { displayName: userName },
    };
    try {
      jitsiRef.current = new window.JitsiMeetExternalAPI(domain, options);
    } catch {
      const script = document.createElement('script');
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => {
        jitsiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      };
      document.body.appendChild(script);
    }
    return () => { jitsiRef.current?.dispose(); jitsiRef.current = null; };
  }, [roomName, userName]);

  return (
    <div className="call-overlay" onClick={onClose}>
      <div style={{ width: '90vw', height: '85vh', maxWidth: 1100, background: '#000', borderRadius: 16, overflow: 'hidden', position: 'relative' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 8 }}>
          <button onClick={copyLink} style={{ background: 'rgba(0,0,0,.5)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>🔗 Скопировать ссылку</button>
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(0,0,0,.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>✕</button>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
