import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import Loading from '../components/Loading';

const COLORS = ['#2b7ef9', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];

export default function OrgChart() {
  const [depts, setDepts] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [selectedDept, setSelectedDept] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/corporate/departments').catch(() => []),
      api.get('/corporate/users').catch(() => []),
    ]).then(([d, u]) => {
      if (d?.length) setDepts(d);
      if (u?.length) setUsers(u);
      setLoading(false);
    });
  }, []);

  const deptUsers = (deptId) => users.filter(u => u.dept_id === deptId);
  const avColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

  return (
    <Layout title="Оргструктура">
      {loading ? <Loading /> : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className={`tab ${!selectedDept ? 'active' : ''}`} onClick={() => setSelectedDept(null)}>🏢 Вся компания</div>
            {depts.map(d => (
              <div key={d.id} className={`tab ${selectedDept === d.id ? 'active' : ''}`} onClick={() => setSelectedDept(d.id)}>
                {d.name} ({d.user_count || deptUsers(d.id).length})
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, padding: '20px 0' }}>
            {(selectedDept ? depts.filter(d => d.id === selectedDept) : depts).map(dept => {
              const members = deptUsers(dept.id);
              const head = members.find(u => u.role === 'admin' || u.role === 'manager');
              const rest = members.filter(u => u !== head);

              return (
                <div key={dept.id} className="org-dept" style={{ width: '100%', maxWidth: 700 }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, margin: '0 0 4px' }}>{dept.name}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{members.length} сотрудников</div>
                  </div>

                  {head && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                      <div className="org-node" style={{ textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => navigate(`/directory`)}>
                        <div className="user-avatar" style={{ background: avColor(head.name), width: 56, height: 56, fontSize: 22, margin: '0 auto 8px', boxShadow: '0 4px 12px rgba(43,126,249,.3)' }}>
                          {head.name?.[0] || '?'}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{head.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{head.title || head.role}</div>
                      </div>
                    </div>
                  )}

                  {head && rest.length > 0 && (
                    <div style={{ borderTop: '2px solid var(--border)', width: '60%', margin: '0 auto 20px' }} />
                  )}

                  {rest.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                      {rest.map(u => (
                        <div key={u.id} className="org-node" style={{ textAlign: 'center', cursor: 'pointer', width: 130 }}
                          onClick={() => navigate(`/directory`)}>
                          <div className="user-avatar" style={{ background: avColor(u.name), width: 48, height: 48, fontSize: 18, margin: '0 auto 6px' }}>
                            {u.name?.[0] || '?'}
                          </div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.3 }}>{u.title || u.role}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {members.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text2)', fontSize: 13 }}>
                      Нет сотрудников в отделе
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
