import { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, Copy, LogOut, Check } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { supabase } from '../../lib/supabase';
import { useChat } from '../../context/ChatContext';
import clsx from 'clsx';

export function UserProfileDrawer({ isOpen, onClose, currentUser }) {
  const { setChatAlert } = useChat();
  const [notificationSound, setNotificationSound] = useState(true);

  if (!isOpen || !currentUser) return null;

  const handleCopyProfileLink = () => {
    navigator.clipboard.writeText(currentUser.email || '');
    setChatAlert({ type: 'success', message: 'Email copied to clipboard' });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[80] bg-black/10 animate-fade-in backdrop-blur-[1px]"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-full md:max-w-[360px] z-[90] bg-[#f8fafc] shadow-2xl flex flex-col animate-slide-in-right border-l border-[#e2e8f0]">
        
        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] relative no-scrollbar">
          
          {/* Header Colored Banner */}
          <div 
            className="h-28 w-full flex justify-end p-4 relative"
            style={{
              backgroundColor: '#757c9a',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 11V7h2v4h4v2h-4v-4H7v-2h4z\' fill=\'%23ffffff\' fill-opacity=\'0.15\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
            }}
          >
            <button 
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-black/15 text-white hover:bg-black/25 border border-white/20 transition-all backdrop-blur-sm shadow-sm"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>

          {/* Overlapping Avatar Profile Block */}
          <div className="bg-white px-6 pb-5 pt-0 flex flex-col items-center border-b border-[#e2e8f0]">
            <div className="-mt-11 mb-2.5 rounded-full bg-white p-1 shadow-sm">
              <Avatar 
                initials={currentUser.initials} 
                color={currentUser.color} 
                size="lg" 
                borderColor="#ffffff"
              />
            </div>
            
            <h3 className="text-[16px] font-bold text-[#0f172a] text-center leading-tight">
              {currentUser.name}
            </h3>
            
            <p className="text-[12px] text-[#64748b] mt-0.5 font-medium text-center">
              {currentUser.role || 'Frontend Developer'}
            </p>

            {/* Quick Actions Buttons */}
            <div className="flex items-center gap-2.5 mt-3.5">
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-2xs"
                title="Send Message"
              >
                <MessageSquare size={14} />
              </button>
              <button 
                onClick={handleCopyProfileLink}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-2xs"
                title="Copy Email"
              >
                <Copy size={13} />
              </button>
            </div>

            {/* Email field */}
            {currentUser.email && (
              <div className="flex items-center gap-2 mt-4 text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer select-all">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="text-[11.5px] font-medium leading-none">{currentUser.email}</span>
              </div>
            )}
          </div>


          {/* Notification Setting Section */}
          <div className="border-b border-[#e2e8f0]">
            <div className="bg-slate-50/50 px-5 py-2 border-b border-[#e2e8f0]/60">
              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Notification Setting</span>
            </div>
            <div className="bg-white px-6 py-3 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-slate-700">Notification Sound</span>
              <button 
                onClick={() => setNotificationSound(!notificationSound)}
                className={clsx(
                  "w-9 h-5 rounded-full flex items-center transition-colors shadow-2xs",
                  notificationSound ? "bg-indigo-600 justify-end" : "bg-slate-200 justify-start"
                )}
                style={{ padding: '2.5px' }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>

          {/* Organizations Section */}
          <div className="border-b border-[#e2e8f0]">
            <div className="bg-slate-50/50 px-5 py-2 border-b border-[#e2e8f0]/60">
              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Organizations</span>
            </div>
            <div className="bg-white px-6 py-3 flex items-center gap-2.5">
              <Check size={14} className="text-[#22c55e] shrink-0 stroke-[2.5]" />
              <span className="text-[12.5px] font-bold text-indigo-600">Digipie Technologies LLP</span>
            </div>
          </div>

        </div>

        {/* Footer Logout button */}
        <div className="p-4 border-t border-[#e2e8f0] bg-white shrink-0">
          <button 
            onClick={handleSignOut}
            className="w-full py-2 bg-red-50 hover:bg-red-100/60 border border-red-200 text-red-600 hover:text-red-700 rounded-lg text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-3xs cursor-pointer"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

      </div>
    </>
  );
}
