import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const CATEGORIES = [
  { key: 'all', label: 'Все', icon: '📁' },
  { key: 'img', label: 'Изображения', icon: '🖼️' },
  { key: 'pdf', label: 'PDF', icon: '📄' },
  { key: 'doc', label: 'Документы', icon: '📝' },
  { key: 'code', label: 'Код', icon: '💻' },
];

const iconForType = (type) => CATEGORIES.find(c => c.key === type)?.icon || '📁';

export default function Files() {
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');

  useEffect(() => {
    api.get('/files/folders').then(data => { setFolders(data); if (data.length) setActiveFolder(data[0].id); }).catch(() => {
      try {
        const d = JSON.parse(localStorage.getItem('files_folders'));
        if (d?.length) { setFolders(d); setActiveFolder(d[0].id); return; }
      } catch {}
      const fallback = [
        { id: 1, name: 'Документы', files: [
          { id: 1, name: 'Отчёт Q2.pdf', size: '2.4 MB', type: 'pdf', created_at: '2026-06-29' },
          { id: 2, name: 'Договор поставки.docx', size: '845 KB', type: 'doc', created_at: '2026-06-28' },
          { id: 3, name: 'Презентация.pptx', size: '5.1 MB', type: 'doc', created_at: '2026-06-25' },
        ]},
        { id: 2, name: 'Дизайн', files: [
          { id: 4, name: 'Макет главной.png', size: '1.8 MB', type: 'img', created_at: '2026-06-28' },
          { id: 5, name: 'Логотип.svg', size: '124 KB', type: 'code', created_at: '2026-06-27' },
          { id: 6, name: 'Баннер.jpg', size: '3.2 MB', type: 'img', created_at: '2026-06-26' },
        ]},
        { id: 3, name: 'Архив', files: [
          { id: 7, name: 'Старая документация.pdf', size: '1.1 MB', type: 'pdf', created_at: '2026-05-15' },
        ]},
        { id: 4, name: 'Скрипты', files: [
          { id: 8, name: 'deploy.sh', size: '2 KB', type: 'code', created_at: '2026-06-30' },
          { id: 9, name: 'backup.py', size: '15 KB', type: 'code', created_at: '2026-06-29' },
        ]},
      ];
      setFolders(fallback);
      setActiveFolder(fallback[0].id);
    });
  }, []);

  const currentFolder = folders.find(f => f.id === activeFolder);
  const allFiles = folders.flatMap(f => (f.files || []).map(file => ({ ...file, folder: f.name })));
  const folderFiles = currentFolder?.files || [];

  const displayFiles = (search ? allFiles : folderFiles)
    .filter(f => category === 'all' || f.type === category)
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout title="Файлы">
      <div className="file-folder" style={{ marginBottom: 12 }}>
        {folders.map(f => (
          <div key={f.id} className={`file-folder${activeFolder === f.id ? ' active' : ''}`} onClick={() => setActiveFolder(f.id)}>
            📁 {f.name}
            <span className="folder-count">{f.files?.length || 0}</span>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {CATEGORIES.map(c => (
          <div key={c.key} className={`tab ${category === c.key ? 'active' : ''}`} onClick={() => setCategory(c.key)}>
            {c.icon} {c.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="dir-search" value={search} onChange={e => setSearch(e.target.value)} placeholder={search ? '🔍 Поиск по всем файлам...' : '🔍 Поиск в папке...'} />
        <button className="btn-sm" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>{view === 'grid' ? '📋 Список' : '🔲 Сетка'}</button>
      </div>

      {displayFiles.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>{search ? 'Ничего не найдено' : 'Папка пуста'}</p>
        </div>
      )}

      {view === 'grid' ? (
        <div className="file-grid">
          {displayFiles.map(f => (
            <div key={f.id} className="file-card">
              <div className="file-card-icon"><span style={{ fontSize: 32 }}>{iconForType(f.type)}</span></div>
              <div className="file-card-name">{f.name}</div>
              <div className="file-card-meta">{f.size} • {f.folder}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="file-list">
          {displayFiles.map(f => (
            <div key={f.id} className="file-row">
              <span style={{ fontSize: 24, width: 36, textAlign: 'center' }}>{iconForType(f.type)}</span>
              <div style={{ flex: 1 }}>
                <div className="file-row-name">{f.name}</div>
                <div className="file-row-meta">{f.size} • {f.folder} • {f.created_at || f.time || ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
