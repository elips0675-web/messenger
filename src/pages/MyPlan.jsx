import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useFetch from '../lib/useFetch';

export default function MyPlan() {
  const navigate = useNavigate();
  const { data: tasks, loading, setData: setTasks } = useFetch('/tasks');

  const toggleStatus = (id) => {
    setTasks(prev => (prev || []).map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t));
  };

  const myTasks = (tasks || []).filter(t => t.assignee == 1 || t.assignee_id == 1);

  return (
    <Layout title="Мой план">
      <h3 style={{ fontSize: 14, marginBottom: 8 }}>Активные ({myTasks.filter(t => t.status !== 'done').length})</h3>
      {myTasks.filter(t => t.status !== 'done').map(t => (
        <div key={t.id} className="task-row">
          <strong style={{ cursor: 'pointer' }} onClick={() => navigate(`/task/${t.id}`)}>{t.title}</strong>
          <button className="btn-sm" onClick={() => toggleStatus(t.id)}>✅</button>
        </div>
      ))}
      <h3 style={{ fontSize: 14, marginTop: 16, marginBottom: 8 }}>Готово ({myTasks.filter(t => t.status === 'done').length})</h3>
      {myTasks.filter(t => t.status === 'done').map(t => (
        <div key={t.id} className="task-row" style={{ opacity: .5 }}>
          <strong>{t.title}</strong>
          <button className="btn-sm" onClick={() => toggleStatus(t.id)}>↩️</button>
        </div>
      ))}
    </Layout>
  );
}
