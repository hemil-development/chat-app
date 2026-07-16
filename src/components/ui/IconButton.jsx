export function IconButton({ icon: Icon, title, onClick, active }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors
        ${active ? 'bg-[#f1f5f9] text-[#0f172a]' : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]'}`}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}
