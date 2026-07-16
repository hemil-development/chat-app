import {
  MessageSquare, Bell, Star,
  FolderOpen, Settings, LogOut,
} from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from './ui/Avatar';
import { supabase } from '../lib/supabase';

const NAV = [
  { id: 'chats',          icon: MessageSquare,  label: 'Messages' },
  { id: 'notifications',  icon: Bell,            label: 'Notifications' },
  { id: 'starred',        icon: Star,            label: 'Starred' },
  { id: 'files',          icon: FolderOpen,      label: 'Files' },
];

export function Sidebar({ activeNav, onNavChange, currentUser, unreadNotifications = 0 }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside
      className="flex flex-col items-center w-[64px] flex-shrink-0 h-screen py-4 gap-2 bg-white"
      style={{ borderRight: '1px solid #e2e8f0' }}
    >
      {/* Logo */}
      <div className="mb-4 flex-shrink-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer select-none shadow-sm"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          <span className="text-white font-bold text-[16px] leading-none">C</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1.5 flex-1 w-full px-2">
        {NAV.map(({ id, icon: Icon, label }) => {
          const badgeValue = id === 'notifications' ? unreadNotifications : 0;
          return (
            <button
              key={id}
              title={label}
              onClick={() => onNavChange(id)}
              className={clsx('nav-btn w-full', activeNav === id && 'active')}
            >
              <Icon size={20} strokeWidth={1.8} />
              {badgeValue > 0 && (
                <span
                  className="absolute -top-1 -right-1 ubadge border-2 border-white"
                  style={{ fontSize: '9px', minWidth: '16px', height: '16px' }}
                >
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-2 w-full px-2 mt-auto">
        <button title="Settings" className="nav-btn w-full">
          <Settings size={18} strokeWidth={1.8} />
        </button>
        <button title="Sign Out" onClick={handleSignOut} className="nav-btn w-full hover:text-red-500">
          <LogOut size={18} strokeWidth={1.8} />
        </button>
        <div className="mt-1 cursor-pointer hover:opacity-90 transition-opacity">
          {currentUser && (
            <Avatar
              initials={currentUser.initials}
              color={currentUser.color}
              status={currentUser.status}
              size="sm"
              borderColor="#ffffff"
            />
          )}
        </div>
      </div>
    </aside>
  );
}
