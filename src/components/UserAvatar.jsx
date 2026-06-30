const COLORS = ['#2b7ef9', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];

export default function UserAvatar({ name, avatar, size = 44 }) {
  const colorIndex = (avatar?.charCodeAt(0) || 0) % COLORS.length;
  return (
    <div className="user-avatar" style={{
      width: size, height: size, fontSize: size * 0.38,
      background: COLORS[colorIndex],
    }}>
      {avatar || name?.[0] || '?'}
    </div>
  );
}
