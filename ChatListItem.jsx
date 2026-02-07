import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ChatListItem({ conversation, currentUserId, onClick, isActive }) {
  const otherParticipantIndex = conversation.participants?.findIndex(p => p !== currentUserId);
  const otherParticipantName = conversation.participant_names?.[otherParticipantIndex] || 'Doctor';
  const otherParticipantPhoto = conversation.participant_photos?.[otherParticipantIndex];
  
  const initials = otherParticipantName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const unreadCount = conversation.unread_count?.[currentUserId] || 0;

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yy');
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-all",
        "hover:bg-slate-50 border-b border-slate-100",
        isActive && "bg-teal-50"
      )}
    >
      {otherParticipantPhoto ? (
        <img src={otherParticipantPhoto} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {initials}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 truncate">
            {conversation.is_group ? conversation.group_name : otherParticipantName}
          </h3>
          <span className={cn(
            "text-xs shrink-0 ml-2",
            unreadCount > 0 ? "text-teal-600 font-medium" : "text-slate-400"
          )}>
            {formatTime(conversation.last_message_time)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-sm text-slate-500 truncate pr-2">
            {conversation.last_message || 'Start a conversation'}
          </p>
          {unreadCount > 0 && (
            <span className="bg-teal-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}