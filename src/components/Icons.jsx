const Svg = ({ children, size = 20, viewBox = '0 0 24 24', ...props }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);

const icons = {
  chats: (
    <Svg size={20}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" opacity=".15" fill="currentColor" />
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8M8 13h6" strokeWidth="2.2" />
      <circle cx="19" cy="6" r="3" fill="#fff" stroke="#e74c3c" strokeWidth="1.5" />
      <circle cx="19" cy="6" r="1.2" fill="#e74c3c" stroke="none" />
    </Svg>
  ),
  files: (
    <Svg size={20}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" opacity=".1" fill="currentColor" />
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <circle cx="12" cy="11" r="1.5" fill="currentColor" opacity=".4" />
    </Svg>
  ),
  projects: (
    <Svg size={20}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" opacity=".1" fill="currentColor" />
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <path d="M12 12l-3 3M12 12l3 3M12 12V8" strokeWidth="2.2" />
    </Svg>
  ),
  myplan: (
    <Svg size={20}>
      <rect x="3" y="3" width="18" height="18" rx="3" opacity=".1" fill="currentColor" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <path d="M9 21V9M15 21V9" opacity=".4" />
      <rect x="14" y="14" width="4" height="4" rx="1" opacity=".1" fill="currentColor" stroke="none" />
    </Svg>
  ),
  kanban: (
    <Svg size={20}>
      <rect x="3" y="3" width="5" height="18" rx="1.2" opacity=".12" fill="currentColor" />
      <rect x="3" y="3" width="5" height="18" rx="1.2" />
      <rect x="9.5" y="7" width="5" height="14" rx="1.2" opacity=".12" fill="currentColor" />
      <rect x="9.5" y="7" width="5" height="14" rx="1.2" />
      <rect x="16" y="5" width="5" height="16" rx="1.2" opacity=".12" fill="currentColor" />
      <rect x="16" y="5" width="5" height="16" rx="1.2" />
      <circle cx="5.5" cy="7" r="1.5" fill="currentColor" />
      <circle cx="12" cy="11" r="1.5" fill="currentColor" />
      <circle cx="18.5" cy="9" r="1.5" fill="currentColor" />
    </Svg>
  ),
  gantt: (
    <Svg size={20}>
      <line x1="3" y1="4" x2="21" y2="4" opacity=".3" />
      <line x1="3" y1="10" x2="21" y2="10" opacity=".3" />
      <line x1="3" y1="16" x2="21" y2="16" opacity=".3" />
      <rect x="7" y="2" width="6" height="4" rx="1" fill="currentColor" opacity=".3" strokeWidth="1.5" />
      <rect x="10" y="8" width="9" height="4" rx="1" fill="currentColor" opacity=".3" strokeWidth="1.5" />
      <rect x="5" y="14" width="7" height="4" rx="1" fill="currentColor" opacity=".3" strokeWidth="1.5" />
      <rect x="14" y="20" width="6" height="4" rx="1" fill="currentColor" opacity=".3" strokeWidth="1.5" />
    </Svg>
  ),
  tasks: (
    <Svg size={20}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2.5" />
      <circle cx="20" cy="4" r="3.5" fill="#fff" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="4" r="1.5" fill="currentColor" stroke="none" />
    </Svg>
  ),
  board: (
    <Svg size={20}>
      <rect x="3" y="3" width="18" height="18" rx="3" opacity=".1" fill="currentColor" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="9" r="2.5" opacity=".2" fill="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="9" r="1.5" fill="currentColor" />
      <path d="M21 15l-5-5-3 3-4-4-6 6" strokeWidth="2.2" />
      <circle cx="18" cy="17" r="2" fill="currentColor" opacity=".2" stroke="none" />
      <circle cx="18" cy="17" r="1" fill="currentColor" stroke="none" />
    </Svg>
  ),
  mindmap: (
    <Svg size={20}>
      <circle cx="12" cy="5" r="3.5" opacity=".1" fill="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="5" r="3.5" />
      <circle cx="5" cy="19" r="3.5" opacity=".1" fill="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="19" r="3.5" />
      <circle cx="19" cy="19" r="3.5" opacity=".1" fill="currentColor" strokeWidth="1.5" />
      <circle cx="19" cy="19" r="3.5" />
      <line x1="11" y1="7.5" x2="6.5" y2="16.5" opacity=".4" strokeDasharray="3 2" />
      <line x1="13" y1="7.5" x2="17.5" y2="16.5" opacity=".4" strokeDasharray="3 2" />
      <circle cx="12" cy="5" r="1.5" fill="currentColor" />
      <circle cx="5" cy="19" r="1.5" fill="currentColor" />
      <circle cx="19" cy="19" r="1.5" fill="currentColor" />
    </Svg>
  ),
  timeline: (
    <Svg size={20}>
      <circle cx="12" cy="12" r="10" opacity=".08" fill="currentColor" />
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="3.5" opacity=".15" fill="currentColor" strokeWidth="1.5" />
    </Svg>
  ),
  directory: (
    <Svg size={20}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" opacity=".12" fill="currentColor" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <circle cx="9" cy="7" r="2.5" fill="currentColor" />
    </Svg>
  ),
  notifications: (
    <Svg size={20}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" opacity=".1" fill="currentColor" />
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <circle cx="18" cy="6" r="4" fill="#fff" stroke="#e74c3c" strokeWidth="1.5" />
      <circle cx="18" cy="6" r="1.5" fill="#e74c3c" stroke="none" />
    </Svg>
  ),
  admin: (
    <Svg size={20}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" opacity=".08" fill="currentColor" />
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 8v6" strokeWidth="2.5" />
      <circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none" />
    </Svg>
  ),
  profile: (
    <Svg size={20}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" opacity=".12" fill="currentColor" />
      <circle cx="12" cy="7" r="4" />
      <circle cx="12" cy="7" r="2.5" fill="currentColor" />
      <path d="M8 14h8" opacity=".4" strokeDasharray="2 2" />
    </Svg>
  ),
  hash: (
    <Svg size={20}>
      <rect x="3" y="3" width="18" height="18" rx="4" opacity=".08" fill="currentColor" />
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <line x1="9" y1="8" x2="9" y2="16" strokeWidth="2.2" />
      <line x1="15" y1="8" x2="15" y2="16" strokeWidth="2.2" />
      <line x1="8" y1="10" x2="16" y2="10" strokeWidth="2.2" />
      <line x1="8" y1="14" x2="16" y2="14" strokeWidth="2.2" />
    </Svg>
  ),
  webhook: (
    <Svg size={20}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" opacity=".08" fill="currentColor" />
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 8v5l3 3" strokeWidth="2.5" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17" r="1.5" fill="currentColor" />
    </Svg>
  ),
  plus: (
    <Svg size={16}>
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" opacity=".8" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="#fff" strokeWidth="2.2" />
      <line x1="12" y1="8" x2="12" y2="16" stroke="#fff" strokeWidth="2.2" />
    </Svg>
  ),
  search: (
    <Svg size={16}>
      <circle cx="11" cy="11" r="7" opacity=".5" />
      <line x1="16" y1="16" x2="21" y2="21" strokeWidth="2.5" />
    </Svg>
  ),
};

export default icons;