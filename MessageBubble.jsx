import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MessageBubble({ message, isOwn, showSender }) {
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'HH:mm');
  };

  const renderContent = () => {
    switch (message.message_type) {
      case 'image':
        return (
          <div className="max-w-xs">
            <img 
              src={message.file_url} 
              alt="Shared image" 
              className="rounded-lg max-w-full"
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );
      case 'file':
        return (
          <a 
            href={message.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-white/20 rounded-lg"
          >
            <FileText className="w-8 h-8" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.content || 'Document'}</p>
              <p className="text-xs opacity-70">Tap to open</p>
            </div>
          </a>
        );
      case 'case_reference':
        return (
          <div className="p-3 bg-white/20 rounded-lg border-l-4 border-teal-400">
            <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Case Reference</p>
            <p className="text-sm">{message.content}</p>
          </div>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <div className={cn(
      "flex flex-col max-w-[80%]",
      isOwn ? "ml-auto items-end" : "mr-auto items-start"
    )}>
      {showSender && !isOwn && (
        <span className="text-xs font-medium text-teal-600 mb-1 px-1">
          {message.sender_name}
        </span>
      )}
      <div className={cn(
        "px-3 py-2 rounded-2xl shadow-sm",
        isOwn 
          ? "bg-teal-500 text-white rounded-br-md" 
          : "bg-white text-slate-800 rounded-bl-md border border-slate-100"
      )}>
        {renderContent()}
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1",
          isOwn ? "text-teal-100" : "text-slate-400"
        )}>
          <span className="text-[10px]">{formatTime(message.created_date)}</span>
          {isOwn && (
            message.is_read 
              ? <CheckCheck className="w-3.5 h-3.5 text-teal-200" />
              : <Check className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
    </div>
  );
}