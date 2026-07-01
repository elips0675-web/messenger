import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { departments as mockDepts } from '../data/mockData';
import Loading from '../components/Loading';

export default function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [dept, setDept] = useState(null);
  const [tab, setTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const avatarRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/auth/me').then(data => {
      setUserData(data);
      setName(data.name);
      setEmail(data.email);
      setPhone(data.phone || '');
      setTitle(data.title || '');
      setBio(data.bio || '');
      setAvatar(data.avatar || '');
      if (data.dept_id) {
        api.get('/auth/departments').then(deps => {
          const d = deps.find(x => x.id === data.dept_id);
          if (d) setDept(d);
        }).catch(() => {
          const d = mockDepts.find(x => x.id === data.dept_id);
          if (d) setDept(d);
        });
      }
    }).catch(() => {
      import('../data/mockData').then(m => {
        const u = m.users[0];
        setUserData(u);
        setName(u.name); setEmail(u.email); setPhone(u.phone); setTitle(u.title);
        setDept(m.departments.find(d => d.id === u.dept));
        try {
          const savedAvatar = localStorage.getItem('profile_avatar');
          if (savedAvatar) setAvatar(savedAvatar);
          const savedFiles = JSON.parse(localStorage.getItem('profile_files') || '[]');
          setFiles(savedFiles);
          const savedBio = localStorage.getItem('profile_bio');
          if (savedBio) setBio(savedBio);
        } catch {}
      });
    });
    try {
      const savedFiles = JSON.parse(localStorage.getItem('profile_files') || '[]');
      if (savedFiles.length) setFiles(savedFiles);
    } catch {}
  }, []);

  const saveProfile = async () => {
    try {
      await api.put('/auth/me', { name, email, phone, title, bio });
    } catch {}
    localStorage.setItem('profile_name', name);
    localStorage.setItem('profile_email', email);
    localStorage.setItem('profile_phone', phone);
    localStorage.setItem('profile_title', title);
    localStorage.setItem('profile_bio', bio);
    setEditing(false);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      setAvatar(data);
      localStorage.setItem('profile_avatar', data);
      try { api.put('/auth/me', { avatar: data }); } catch {}
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFileUpload = (e) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const entry = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: ev.target.result,
          date: new Date().toLocaleDateString('ru-RU'),
        };
        setFiles(prev => {
          const next = [entry, ...prev];
          localStorage.setItem('profile_files', JSON.stringify(next));
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
    setTimeout(() => setUploading(false), 500);
    e.target.value = '';
  };

  const deleteFile = (id) => {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      localStorage.setItem('profile_files', JSON.stringify(next));
      return next;
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1048576).toFixed(1)} МБ`;
  };

  const isImg = (type) => type?.startsWith('image/');

  if (!userData) return <Layout title="Профиль"><Loading /></Layout>;

  return (
    <Layout title="Профиль">
      <div className="card" style={{ maxWidth: 700 }}>
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Профиль</button>
          <button className={`tab ${tab === 'files' ? 'active' : ''}`} onClick={() => setTab('files')}>Файлы</button>
          <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Настройки</button>
        </div>

        {tab === 'profile' && (
          <>
            <div className="profile-header">
              <div style={{ position: 'relative' }}>
                {avatar ? (
                  <img src={avatar} alt="avatar" className="user-avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="user-avatar" style={{ width: 64, height: 64, fontSize: 24, background: 'var(--gradient)', color: '#fff' }}>
                    {(name || userData.name)?.[0] || '?'}
                  </div>
                )}
                <button onClick={() => avatarRef.current?.click()} style={{
                  position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--primary)', color: '#fff', border: '2px solid var(--surface)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>📷</button>
                <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </div>
              <div className="profile-info" style={{ flex: 1 }}>
                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя" className="edit-input" />
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Должность" className="edit-input" />
                  </div>
                ) : (
                  <>
                    <h3>{name || userData.name}</h3>
                    <p>{title || userData.title} • {dept?.name}</p>
                  </>
                )}
              </div>
            </div>

            <div className="profile-details">
              {editing ? (
                <>
                  <div className="info-row"><strong>Email</strong><input value={email} onChange={e => setEmail(e.target.value)} className="edit-input" /></div>
                  <div className="info-row"><strong>Телефон</strong><input value={phone} onChange={e => setPhone(e.target.value)} className="edit-input" /></div>
                  <div className="info-row"><strong>Отдел</strong><span>{dept?.name}</span></div>
                  <div className="info-row"><strong>Должность</strong><input value={title} onChange={e => setTitle(e.target.value)} className="edit-input" /></div>
                  <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <strong>О себе</strong>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} className="edit-input" style={{ width: '100%', height: 80, resize: 'vertical' }} placeholder="Расскажите о себе..." />
                  </div>
                </>
              ) : (
                <>
                  <div className="info-row"><strong>Email</strong>{email || userData.email}</div>
                  <div className="info-row"><strong>Телефон</strong>{phone || userData.phone}</div>
                  <div className="info-row"><strong>Отдел</strong>{dept?.name}</div>
                  <div className="info-row"><strong>Должность</strong>{title || userData.title}</div>
                  {bio && <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}><strong>О себе</strong><span style={{ lineHeight: 1.5 }}>{bio}</span></div>}
                </>
              )}
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {editing ? (
                <>
                  <button className="btn-primary" onClick={saveProfile}>💾 Сохранить</button>
                  <button className="send-btn" style={{ background: 'var(--bg)', color: 'var(--text)' }} onClick={() => setEditing(false)}>Отмена</button>
                </>
              ) : (
                <>
                  <button className="btn-primary" style={{ width: 'auto', padding: '8px 24px' }} onClick={() => setEditing(true)}>✏️ Редактировать</button>
                  <button className="send-btn" style={{ background: 'var(--bg)', color: 'var(--text)' }} onClick={() => navigate('/chats')}>💬 Написать в чат</button>
                  <button className="send-btn" style={{ background: 'var(--bg)', color: 'var(--text)' }} onClick={() => navigate('/2fa')}>🔐 2FA</button>
                </>
              )}
            </div>
          </>
        )}

        {tab === 'files' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Всего файлов: {files.length}</span>
              <button className="btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? '⏳ Загрузка...' : '📎 Загрузить файлы'}
              </button>
              <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
            </div>

            {files.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                <div>Нет файлов. Нажмите «Загрузить файлы»</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map(f => (
                <div key={f.id} className="task-card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => isImg(f.type) && setPreviewFile(f)}>
                  <div style={{ fontSize: 24, width: 36, textAlign: 'center' }}>
                    {isImg(f.type) ? '🖼️' : '📄'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{formatSize(f.size)} • {f.date}</div>
                  </div>
                  <button className="btn-sm" onClick={(e) => { e.stopPropagation(); deleteFile(f.id); }}>🗑️</button>
                </div>
              ))}
            </div>

            {previewFile && (
              <div className="lightbox" onClick={() => setPreviewFile(null)}>
                <div className="lightbox-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '80vw', maxHeight: '80vh' }}>
                  <img src={previewFile.data} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 12 }} />
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text2)' }}>{previewFile.name}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div>
            <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <strong>Уведомления</strong>
              <label className="switch-row"><input type="checkbox" defaultChecked /> Звук уведомлений</label>
              <label className="switch-row"><input type="checkbox" defaultChecked /> Push-уведомления</label>
              <label className="switch-row"><input type="checkbox" defaultChecked /> Уведомления о днях рождения</label>
            </div>
            <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginTop: 20 }}>
              <strong>Приватность</strong>
              <label className="switch-row"><input type="checkbox" defaultChecked /> Показывать онлайн-статус</label>
              <label className="switch-row"><input type="checkbox" /> Читать уведомления в фоне</label>
            </div>
            <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginTop: 20 }}>
              <strong>Вид</strong>
              <label className="switch-row"><input type="checkbox" /> Компактный режим</label>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
