import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './lib/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Chats = lazy(() => import('./pages/Chats'));
const Chat = lazy(() => import('./pages/Chat'));
const Tasks = lazy(() => import('./pages/Tasks'));
const TaskDetail = lazy(() => import('./pages/TaskDetail'));
const Kanban = lazy(() => import('./pages/Kanban'));
const Timeline = lazy(() => import('./pages/Timeline'));
const MyPlan = lazy(() => import('./pages/MyPlan'));
const Files = lazy(() => import('./pages/Files'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Gantt = lazy(() => import('./pages/Gantt'));
const Admin = lazy(() => import('./pages/Admin'));
const Directory = lazy(() => import('./pages/Directory'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Board = lazy(() => import('./pages/Board'));
const MindMap = lazy(() => import('./pages/MindMap'));
const TwoFactorSetup = lazy(() => import('./pages/TwoFactorSetup'));
const ChannelsPage = lazy(() => import('./pages/ChannelsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const WebhooksPage = lazy(() => import('./pages/WebhooksPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const DataRetentionPage = lazy(() => import('./pages/DataRetentionPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BotsPage = lazy(() => import('./pages/BotsPage'));
const Feed = lazy(() => import('./pages/Feed'));
const Wiki = lazy(() => import('./pages/Wiki'));
const OrgChart = lazy(() => import('./pages/OrgChart'));
const Workflows = lazy(() => import('./pages/Workflows'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder'));
const RequestDetail = lazy(() => import('./pages/RequestDetail'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Polls = lazy(() => import('./pages/Polls'));
const Tickets = lazy(() => import('./pages/Tickets'));

function Loading() {
  return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Загрузка...</div>;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
      <ToastProvider>
      <ErrorBoundary>
      <Suspense fallback={<Loading />}>
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
        <Route path="/feed" element={<Feed />} />
        <Route path="/wiki" element={<Wiki />} />
        <Route path="/orgchart" element={<OrgChart />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/workflows/:id" element={<WorkflowBuilder />} />
        <Route path="/workflows/requests/:id" element={<RequestDetail />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/polls" element={<Polls />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/bots" element={<BotsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      </ErrorBoundary>
      </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
