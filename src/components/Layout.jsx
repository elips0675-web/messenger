import { NavLink, useNavigate } from 'react-router-dom';
import { chats, tasks, notifications } from '../data/mockData';
import { useState } from 'react';
import icons from './Icons';
import { useTheme } from '../lib/ThemeContext';

export default function Layout({ children, title, onBack, showBack }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const totalUnread = chats.reduce((s, c) => s + c.unread, 0);
  const activeTasks = tasks.filter(t => t.status !== 'done').length;

  const nav = [
    { path: '/chats', icon: icons.chats, label: 'Чаты', badge: totalUnread || null },
    { path: '/files', icon: icons.files, label: 'Файлы' },
    { path: '/projects', icon: icons.projects, label: 'Проекты' },
    { path: '/myplan', icon: icons.myplan, label: 'Мой план', badge: tasks.filter(t => t.assignee === 1 && t.status !== 'done').length || null },
    { path: '/kanban', icon: icons.kanban, label: 'Канбан' },
    { path: '/gantt', icon: icons.gantt, label: 'Гант' },
    { path: '/tasks', icon: icons.tasks, label: 'Задачи', badge: activeTasks || null },
    { path: '/board', icon: icons.board, label: 'Доска' },
    { path: '/mindmap', icon: icons.mindmap, label: 'Mind Map' },
    { path: '/timeline', icon: icons.timeline, label: 'Сроки' },
    { path: '/directory', icon: icons.directory, label: 'Сотрудники' },
    { path: '/calendar', icon: icons.timeline, label: 'Календарь' },
    { path: '/channels', icon: icons.hash, label: 'Каналы' },
    { path: '/notifications', icon: icons.notifications, label: 'Уведомления', badge: notifications.length || null },
    { path: '/audit', icon: icons.admin, label: 'Аудит' },
    { path: '/retention', icon: icons.timeline, label: 'Хранение' },
    { path: '/search', icon: icons.search || '🔍', label: 'Поиск' },
    { path: '/bots', icon: icons.bot || '🤖', label: 'Боты' },
    { path: '/webhooks', icon: icons.webhook || icons.chats, label: 'Вебхуки' },
    { path: '/admin', icon: icons.admin, label: 'Администрирование' },
    { path: '/profile', icon: icons.profile, label: 'Профиль' },
  ];

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">💼</div>
          <h1>Corp Messenger</h1>
        </div>
        <nav className="sidebar-nav">
          {nav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
              {item.badge ? <span className="badge">{item.badge}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="dot"></span>
          <span style={{ flex: 1 }}>v4.0 • Портал</span>
          <button onClick={toggle} style={{ fontSize: 16, padding: '2px 6px', borderRadius: 6, color: 'var(--text2)' }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </aside>
      <div className="main-area">
        <div className="main-header">
          <button className="back-btn" onClick={() => { if (showBack && onBack) onBack(); else navigate('/chats'); }} style={{ display: showBack ? 'block' : 'none' }}>
            ←
          </button>
          <button className="back-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: showBack ? 'none' : 'block' }}>
            ☰
          </button>
          <h2>{title || 'Корпоративный мессенджер'}</h2>
        </div>
        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  );
}
