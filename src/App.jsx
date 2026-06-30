import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chats from './pages/Chats';
import Chat from './pages/Chat';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Kanban from './pages/Kanban';
import Timeline from './pages/Timeline';
import MyPlan from './pages/MyPlan';
import Files from './pages/Files';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Gantt from './pages/Gantt';
import Admin from './pages/Admin';
import Directory from './pages/Directory';
import NotificationsPage from './pages/Notifications';
import Profile from './pages/Profile';
import Board from './pages/Board';
import MindMap from './pages/MindMap';
import TwoFactorSetup from './pages/TwoFactorSetup';
import ChannelsPage from './pages/ChannelsPage';
import CalendarPage from './pages/CalendarPage';
import WebhooksPage from './pages/WebhooksPage';
import AuditLogPage from './pages/AuditLogPage';
import DataRetentionPage from './pages/DataRetentionPage';
import SearchPage from './pages/SearchPage';
import BotsPage from './pages/BotsPage';
import { ThemeProvider } from './lib/ThemeContext';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/files" element={<Files />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/task/:id" element={<TaskDetail />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/myplan" element={<MyPlan />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/gantt" element={<Gantt />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/board" element={<Board />} />
        <Route path="/mindmap" element={<MindMap />} />
        <Route path="/2fa" element={<TwoFactorSetup />} />
        <Route path="/channels" element={<ChannelsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/webhooks" element={<WebhooksPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/retention" element={<DataRetentionPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/bots" element={<BotsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
