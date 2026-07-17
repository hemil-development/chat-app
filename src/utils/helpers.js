export const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#3b82f6', '#84cc16', '#f97316', '#a855f7', '#6366f1'];

export function getUserColor(userId) {
  if (!userId) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

export function formatMessageTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const sortContacts = (list) => {
  return [...list].sort((a, b) => {
    const timeA = a.rawTimestamp ? new Date(a.rawTimestamp).getTime() : 0;
    const timeB = b.rawTimestamp ? new Date(b.rawTimestamp).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return a.name.localeCompare(b.name);
  });
};
