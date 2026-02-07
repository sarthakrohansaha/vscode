import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, MessageCircle, Users, Briefcase, Calendar, User, Menu, X,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Chats', icon: MessageCircle, page: 'Chats' },
  { name: 'Network', icon: Users, page: 'Network' },
  { name: 'Cases', icon: Briefcase, page: 'Cases' },
  { name: 'Events', icon: Calendar, page: 'Events' },
  { name: 'Profile', icon: User, page: 'Profile' },
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        
        // Get unread message count
        const conversations = await base44.entities.Conversation.filter({
          participants: u.email
        });
        
        let total = 0;
        conversations.forEach(c => {
          total += (c.unread_count?.[u.email] || 0);
        });
        setUnreadCount(total);
      } catch (e) {
        console.log('Not logged in');
      }
    };
    loadData();

    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Full-screen pages without layout
  if (currentPageName === 'Chats') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex-col z-50">
        <div className="p-6 border-b border-slate-100">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">DocConnect</h1>
              <p className="text-xs text-slate-500">Anonymous Network</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.name}>
                <Link
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    currentPageName === item.page
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {item.name === 'Chats' && unreadCount > 0 && (
                    <Badge className="ml-auto bg-teal-500">{unreadCount}</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {user && (
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
                {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{user.full_name || 'Doctor'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800">DocConnect</span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg">
            <ul className="p-2">
              {navItems.map(item => (
                <li key={item.name}>
                  <Link
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      currentPageName === item.page
                        ? "bg-teal-50 text-teal-700"
                        : "text-slate-600"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                    {item.name === 'Chats' && unreadCount > 0 && (
                      <Badge className="ml-auto bg-teal-500">{unreadCount}</Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map(item => (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all relative",
                currentPageName === item.page
                  ? "text-teal-600"
                  : "text-slate-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
              {item.name === 'Chats' && unreadCount > 0 && (
                <span className="absolute -top-1 right-1 w-4 h-4 bg-teal-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}