const Svg = ({ children, size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);

export const FolderIcon = ({ size = 24 }) => (
  <Svg size={size} stroke="#f39c12" fill="#f39c12" fillOpacity=".15"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></Svg>
);

const icons = {
  pdf: { paths: [<path key="a" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />, <polyline key="b" points="14 2 14 8 20 8" />, <path key="c" d="M9 15h6" />, <path key="d" d="M12 12v6" />], color: '#e74c3c' },
  docx: { paths: [<path key="a" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />, <polyline key="b" points="14 2 14 8 20 8" />, <path key="c" d="M9 12h6" />, <path key="d" d="M9 16h6" />, <path key="e" d="M9 20h4" />], color: '#3498db' },
  xlsx: { paths: [<path key="a" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />, <polyline key="b" points="14 2 14 8 20 8" />, <path key="c" d="M8 13l2 3-2 3" />, <path key="d" d="M16 13l-2 3 2 3" />, <path key="e" d="M11 11l-1 6" />, <path key="f" d="M15 11l1 6" />], color: '#27ae60' },
  pptx: { paths: [<path key="a" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />, <polyline key="b" points="14 2 14 8 20 8" />, <path key="c" d="M8 13h5" />, <path key="d" d="M10 13v6" />, <rect key="e" x="10" y="13" width="4" height="3" rx="1" />], color: '#e17055' },
  img: { paths: [<rect key="a" x="3" y="3" width="18" height="18" rx="2" ry="2" />, <circle key="b" cx="8.5" cy="8.5" r="1.5" />, <polyline key="c" points="21 15 16 10 5 21" />], color: '#9b59b6' },
  zip: { paths: [<path key="a" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />, <path key="b" d="M8 12h8" />, <path key="c" d="M12 8v8" />], color: '#f39c12' },
  default: { paths: [<path key="a" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />, <polyline key="b" points="14 2 14 8 20 8" />], color: '#7f8c8d' },
};

export function FileTypeIcon({ type, size = 24 }) {
  const cfg = icons[type] || icons.default;
  return (
    <span style={{ color: cfg.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {cfg.paths}
      </svg>
    </span>
  );
}
