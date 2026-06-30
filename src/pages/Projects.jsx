import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/projects').then(setProjects).catch(() => {
      try { const d = JSON.parse(localStorage.getItem('projects_data') || '[]'); setProjects(d); } catch {}
    });
  }, []);

  return (
    <Layout title="Проекты">
      <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
        {projects.map(p => (
          <div key={p.id} className="card project-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/project/${p.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{p.icon || '📁'}</span>
                <div>
                  <h3 style={{ margin: 0 }}>{p.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{p.description || 'Нет описания'} • {p.member_count || p.members?.length || 0} участников</div>
                </div>
              </div>
              <span className={`priority-tag status-${p.status || 'active'}`}>{p.status === 'done' ? '✅' : p.status === 'active' ? '🟢' : '🔄'}</span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
