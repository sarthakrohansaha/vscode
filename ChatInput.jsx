import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Image, FileText, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleSend = () => {
    if ((!message.trim() && !attachment) || disabled) return;
    
    onSend({
      content: message.trim(),
      message_type: attachment?.type || 'text',
      file_url: attachment?.url
    });
    
    setMessage('');
    setAttachment(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (file, type) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachment({ url: file_url, type, name: file.name });
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  return (
    <div className="bg-slate-50 border-t border-slate-200 p-3">
      {attachment && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-lg border">
          {attachment.type === 'image' ? (
            <Image className="w-5 h-5 text-teal-500" />
          ) : (
            <FileText className="w-5 h-5 text-teal-500" />
          )}
          <span className="text-sm text-slate-600 flex-1 truncate">{attachment.name}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => setAttachment(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 text-slate-500 hover:text-teal-600"
              disabled={uploading}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
              <Image className="w-4 h-4 mr-2 text-teal-500" />
              Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'file')}
        />

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 bg-white border-slate-200 focus-visible:ring-teal-500"
          disabled={disabled || uploading}
        />

        <Button 
          onClick={handleSend}
          disabled={(!message.trim() && !attachment) || disabled || uploading}
          size="icon"
          className="shrink-0 bg-teal-500 hover:bg-teal-600"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}