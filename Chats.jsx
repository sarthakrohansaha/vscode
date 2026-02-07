import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MoreVertical, Search, Phone, Video, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatListItem from '@/components/chat/ChatListItem';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import { cn } from '@/lib/utils';

export default function Chats() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatList, setShowChatList] = useState(true);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const conversationIdFromUrl = urlParams.get('conversationId');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const profiles = await base44.entities.DoctorProfile.filter({ created_by: u.email });
      if (profiles.length > 0) setProfile(profiles[0]);
    };
    loadUser();
  }, []);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      const convos = await base44.entities.Conversation.filter({
        participants: user.email
      }, '-last_message_time');
      return convos;
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0) {
      const convo = conversations.find(c => c.id === conversationIdFromUrl);
      if (convo) {
        setSelectedConversation(convo);
        setShowChatList(false);
      }
    }
  }, [conversationIdFromUrl, conversations]);

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => base44.entities.Message.filter(
      { conversation_id: selectedConversation.id },
      'created_date'
    ),
    enabled: !!selectedConversation?.id,
    refetchInterval: 2000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && user && messages.length > 0) {
      const unreadMessages = messages.filter(
        m => m.sender_id !== user.email && !m.read_by?.includes(user.email)
      );
      unreadMessages.forEach(async (msg) => {
        await base44.entities.Message.update(msg.id, {
          is_read: true,
          read_by: [...(msg.read_by || []), user.email]
        });
      });
      
      if (selectedConversation.unread_count?.[user.email] > 0) {
        base44.entities.Conversation.update(selectedConversation.id, {
          unread_count: { ...selectedConversation.unread_count, [user.email]: 0 }
        });
      }
    }
  }, [selectedConversation, messages, user]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const message = await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        sender_id: user.email,
        sender_name: profile?.full_name || user.full_name,
        sender_photo: profile?.profile_photo,
        ...messageData,
        read_by: [user.email]
      });

      const otherParticipant = selectedConversation.participants.find(p => p !== user.email);
      const currentUnread = selectedConversation.unread_count || {};
      
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: messageData.content.slice(0, 50),
        last_message_time: new Date().toISOString(),
        last_message_sender: user.email,
        unread_count: {
          ...currentUnread,
          [otherParticipant]: (currentUnread[otherParticipant] || 0) + 1
        }
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedConversation?.id]);
      queryClient.invalidateQueries(['conversations']);
    }
  });

  const filteredConversations = conversations.filter(c => {
    const otherIndex = c.participants?.findIndex(p => p !== user?.email);
    const otherName = c.participant_names?.[otherIndex] || '';
    return otherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getOtherParticipant = (conversation) => {
    const otherIndex = conversation.participants?.findIndex(p => p !== user?.email);
    return {
      name: conversation.participant_names?.[otherIndex] || 'Doctor',
      photo: conversation.participant_photos?.[otherIndex]
    };
  };

  const other = selectedConversation ? getOtherParticipant(selectedConversation) : { name: '', photo: null };
  const initials = other.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="h-screen flex bg-slate-100">
      {/* Chat List Sidebar */}
      <div className={cn(
        "w-full md:w-96 bg-white border-r border-slate-200 flex flex-col",
        "md:flex",
        !showChatList && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-teal-600 to-teal-500">
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <p className="text-teal-100 text-sm">{profile?.full_name}</p>
        </div>

        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-10 bg-slate-50 border-none"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loadingConversations ? (
            <div className="p-4 text-center text-slate-500">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="mb-2">No conversations yet</p>
              <p className="text-sm">Start by messaging a doctor from the Network page</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <ChatListItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={user?.email}
                isActive={selectedConversation?.id === conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  setShowChatList(false);
                }}
              />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        showChatList && "hidden md:flex"
      )}>
        {selectedConversation ? (
          <>
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setShowChatList(true)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              {other.photo ? (
                <img src={other.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                  {initials}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-800 truncate">{other.name}</h2>
                <p className="text-xs text-slate-500">Online</p>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-slate-500">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-500">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-500">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div 
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23e2e8f0" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
            >
              {loadingMessages ? (
                <div className="text-center text-slate-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <p>No messages yet</p>
                  <p className="text-sm">Say hello to start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === user?.email}
                    showSender={selectedConversation.is_group && message.sender_id !== user?.email}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <ChatInput
              onSend={(data) => sendMessageMutation.mutate(data)}
              disabled={sendMessageMutation.isPending}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center text-slate-500">
              <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-12 h-12 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700">Your Messages</h2>
              <p className="mt-2">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}