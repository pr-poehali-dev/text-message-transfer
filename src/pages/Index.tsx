import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { AuthScreen } from "@/components/messenger/AuthScreen";
import { ChatsPanel, ChatWindow } from "@/components/messenger/ChatView";
import { ContactsPanel, NotificationsPanel, SearchPanel, SettingsPanel } from "@/components/messenger/Sidebar";
import type { User, Chat, Tab } from "@/components/messenger/types";

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getSavedUser());
  const [tab, setTab] = useState<Tab>("chats");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  const loadChats = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await api.getChats();
      setChats(data.chats || []);
    } catch { /* ignore */ }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setChatsLoading(true);
    loadChats().finally(() => setChatsLoading(false));
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, [loadChats]);

  const handleAuth = (user: User) => {
    setCurrentUser(user);
    setTab("chats");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setChats([]);
    setSelectedChat(null);
  };

  const handleStartChat = (chatId: number) => {
    setTab("chats");
    setSelectedChat(chatId);
    loadChats();
  };

  if (!currentUser) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  const navItems: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "chats", icon: "MessageSquare", label: "Чаты", badge: chats.reduce((s, c) => s + (c.unread || 0), 0) || undefined },
    { id: "contacts", icon: "Users", label: "Контакты" },
    { id: "notifications", icon: "Bell", label: "Центр", badge: 2 },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "settings", icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="h-screen w-screen flex bg-[hsl(220_16%_7%)] overflow-hidden">
      <div className="w-16 flex flex-col items-center py-4 gap-1 border-r border-[hsl(220_12%_12%)] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[hsl(168_84%_10%)] border border-[hsl(168_84%_22%)] flex items-center justify-center mb-3 glow-green">
          <Icon name="ShieldCheck" size={18} className="text-[hsl(168_84%_52%)]" />
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setTab(item.id); if (item.id !== "chats") setSelectedChat(null); }}
            className={`nav-item relative w-12 ${tab === item.id ? "active" : ""}`}
            title={item.label}
          >
            <Icon name={item.icon} size={18} />
            {item.badge ? (
              <span className="absolute top-2 right-1.5 min-w-4 h-4 rounded-full bg-[hsl(168_84%_52%)] text-[hsl(220_16%_7%)] text-[9px] font-bold flex items-center justify-center px-1">
                {item.badge}
              </span>
            ) : null}
            <span className="text-[9px] leading-none">{item.label}</span>
          </button>
        ))}
      </div>

      {tab === "chats" ? (
        <>
          <div className="w-72 border-r border-[hsl(220_12%_12%)] flex flex-col flex-shrink-0">
            <ChatsPanel chats={chats} onSelect={setSelectedChat} selected={selectedChat} loading={chatsLoading} />
          </div>
          <ChatWindow chatId={selectedChat} chats={chats} currentUser={currentUser} onMessageSent={loadChats} />
        </>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === "contacts" && <ContactsPanel currentUser={currentUser} onStartChat={handleStartChat} />}
          {tab === "notifications" && <NotificationsPanel />}
          {tab === "search" && <SearchPanel chats={chats} />}
          {tab === "settings" && <SettingsPanel currentUser={currentUser} onLogout={handleLogout} />}
        </div>
      )}
    </div>
  );
}
