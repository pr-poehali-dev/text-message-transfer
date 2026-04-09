import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { AvatarCircle } from "./ChatView";
import { NOTIFICATIONS_STATIC } from "./types";
import type { Chat, Message, User } from "./types";

export function ContactsPanel({ currentUser, onStartChat }: { currentUser: User; onStartChat: (chatId: number) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<number | null>(null);

  useEffect(() => {
    api.getUsers().then((d) => setUsers(d.users || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const startChat = async (userId: number) => {
    setCreating(userId);
    try {
      const data = await api.createChat(userId);
      onStartChat(data.chat_id);
    } catch {
      // ignore
    } finally {
      setCreating(null);
    }
  };

  const online = users.filter((u) => u.status === "online");
  const offline = users.filter((u) => u.status !== "online");

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
      <h2 className="text-lg font-semibold text-[hsl(210_20%_92%)] px-2 mb-4">Контакты</h2>
      {loading && <div className="flex flex-col gap-2 px-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-[hsl(220_12%_13%)] animate-pulse" />)}</div>}
      {!loading && users.length === 0 && (
        <p className="text-sm text-[hsl(215_12%_40%)] px-2">Пока нет других пользователей. Пригласите коллег зарегистрироваться.</p>
      )}
      {online.length > 0 && (
        <>
          <p className="text-xs text-[hsl(168_84%_42%)] px-2 mb-3 font-semibold uppercase tracking-wider">Онлайн — {online.length}</p>
          <div className="space-y-0.5 mb-6">
            {online.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(220_12%_13%)] cursor-pointer transition-all animate-slide-in" style={{ animationDelay: `${i * 40}ms` }}>
                <AvatarCircle initials={u.avatar_initials} online={true} />
                <div>
                  <p className="text-sm font-medium text-[hsl(210_20%_92%)]">{u.display_name}</p>
                  <p className="text-xs text-[hsl(168_84%_42%)]">онлайн</p>
                </div>
                <button
                  onClick={() => startChat(u.id)}
                  disabled={creating === u.id}
                  className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(215_12%_48%)] hover:text-[hsl(168_84%_52%)] hover:bg-[hsl(168_84%_10%)] transition-all disabled:opacity-50"
                >
                  {creating === u.id ? <div className="w-3.5 h-3.5 border border-[hsl(168_84%_52%)] border-t-transparent rounded-full animate-spin" /> : <Icon name="MessageSquare" size={14} />}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {offline.length > 0 && (
        <>
          <p className="text-xs text-[hsl(215_12%_40%)] px-2 mb-3 font-semibold uppercase tracking-wider">Не в сети — {offline.length}</p>
          <div className="space-y-0.5">
            {offline.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(220_12%_13%)] cursor-pointer transition-all animate-slide-in" style={{ animationDelay: `${(online.length + i) * 40}ms` }}>
                <AvatarCircle initials={u.avatar_initials} online={false} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[hsl(210_20%_75%)]">{u.display_name}</p>
                  <p className="text-xs text-[hsl(215_12%_40%)]">@{u.username}</p>
                </div>
                <button
                  onClick={() => startChat(u.id)}
                  disabled={creating === u.id}
                  className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(215_12%_48%)] hover:text-[hsl(168_84%_52%)] hover:bg-[hsl(168_84%_10%)] transition-all disabled:opacity-50"
                >
                  {creating === u.id ? <div className="w-3.5 h-3.5 border border-[hsl(168_84%_52%)] border-t-transparent rounded-full animate-spin" /> : <Icon name="MessageSquare" size={14} />}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function NotificationsPanel() {
  const icons: Record<string, string> = { message: "MessageSquare", security: "ShieldAlert", contact: "UserPlus" };
  const colors: Record<string, string> = { message: "168 84% 42%", security: "38 92% 55%", contact: "210 84% 62%" };
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
      <div className="flex items-center justify-between px-2 mb-4">
        <h2 className="text-lg font-semibold text-[hsl(210_20%_92%)]">Уведомления</h2>
      </div>
      <div className="space-y-1.5">
        {NOTIFICATIONS_STATIC.map((n, i) => (
          <div key={n.id} className={`flex items-start gap-3 px-3 py-3 rounded-xl transition-all animate-fade-in cursor-pointer ${n.read ? "opacity-50" : "bg-[hsl(220_12%_13%)]"}`} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `hsl(${colors[n.type]} / 0.12)` }}>
              <Icon name={icons[n.type]} size={15} style={{ color: `hsl(${colors[n.type]})` }} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-[hsl(210_20%_88%)] leading-snug">{n.text}</p>
              <p className="text-xs text-[hsl(215_12%_40%)] mt-0.5">{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-[hsl(168_84%_52%)] flex-shrink-0 mt-1.5 animate-pulse-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchPanel({ chats }: { chats: Chat[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ chat: string; avatar: string; text: string; time: string; chatId: number }[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setSearching(true);
    const run = async () => {
      const all: typeof results = [];
      for (const chat of chats) {
        try {
          const data = await api.getMessages(chat.id);
          const msgs = (data.messages || []) as Message[];
          msgs.filter(m => m.text.toLowerCase().includes(query.toLowerCase()))
            .forEach(m => all.push({ chat: chat.name, avatar: chat.avatar, text: m.text, time: m.time, chatId: chat.id }));
        } catch { /* skip */ }
      }
      setResults(all);
      setSearching(false);
    };
    run();
  }, [query, chats]);

  return (
    <div className="flex-1 flex flex-col p-4">
      <h2 className="text-lg font-semibold text-[hsl(210_20%_92%)] px-2 mb-4">Поиск сообщений</h2>
      <div className="flex items-center gap-2 bg-[hsl(220_12%_13%)] rounded-xl px-4 py-3 border border-[hsl(220_12%_19%)] focus-within:border-[hsl(168_84%_28%)] transition-colors mb-4">
        <Icon name="Search" size={15} className="text-[hsl(215_12%_48%)]" />
        <input
          className="flex-1 bg-transparent text-sm text-[hsl(210_20%_92%)] placeholder-[hsl(215_12%_36%)] outline-none"
          placeholder="Поиск в зашифрованных сообщениях..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && <button onClick={() => setQuery("")} className="text-[hsl(215_12%_40%)]"><Icon name="X" size={14} /></button>}
      </div>
      {searching && <div className="flex justify-center py-4"><div className="w-5 h-5 rounded-full border-2 border-[hsl(168_84%_52%)] border-t-transparent animate-spin" /></div>}
      {!searching && query.length > 1 && results.length === 0 && (
        <div className="flex flex-col items-center h-32 justify-center text-[hsl(215_12%_40%)]">
          <Icon name="SearchX" size={28} className="mb-2 opacity-50" />
          <p className="text-sm">Ничего не найдено</p>
        </div>
      )}
      {results.map((r, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-xl bg-[hsl(220_12%_13%)] hover:bg-[hsl(220_12%_15%)] cursor-pointer transition-all animate-fade-in mb-1.5" style={{ animationDelay: `${i * 40}ms` }}>
          <AvatarCircle initials={r.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-[hsl(168_84%_42%)]">{r.chat}</span>
              <span className="text-xs text-[hsl(215_12%_40%)]">{r.time}</span>
            </div>
            <p className="text-sm text-[hsl(210_20%_88%)]">
              {r.text.split(new RegExp(`(${query})`, "gi")).map((part, j) =>
                part.toLowerCase() === query.toLowerCase()
                  ? <mark key={j} className="bg-[hsl(168_84%_30%)] text-[hsl(168_84%_90%)] rounded px-0.5">{part}</mark>
                  : part
              )}
            </p>
          </div>
          <Icon name="Lock" size={10} className="text-[hsl(168_84%_30%)] flex-shrink-0 mt-1" />
        </div>
      ))}
      {query.length <= 1 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(220_12%_13%)] border border-[hsl(220_12%_19%)] flex items-center justify-center">
            <Icon name="Search" size={24} className="text-[hsl(215_12%_40%)]" />
          </div>
          <p className="text-sm text-[hsl(215_12%_40%)]">Введите запрос для поиска<br />по зашифрованным сообщениям</p>
        </div>
      )}
    </div>
  );
}

export function SettingsPanel({ currentUser, onLogout }: { currentUser: User; onLogout: () => void }) {
  const [e2e] = useState(true);
  const [notifs, setNotifs] = useState(true);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ width: "40px", height: "22px" }} className={`relative rounded-full transition-colors duration-200 ${value ? "bg-[hsl(168_84%_52%)]" : "bg-[hsl(220_12%_20%)]"}`}>
      <div style={{ width: "18px", height: "18px" }} className={`absolute top-0.5 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  const logout = async () => {
    await api.logout().catch(() => {});
    api.clearSession();
    onLogout();
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
      <h2 className="text-lg font-semibold text-[hsl(210_20%_92%)] px-2 mb-5">Настройки</h2>
      <div className="px-3 py-4 rounded-2xl bg-[hsl(168_84%_8%)] border border-[hsl(168_84%_18%)] mb-5 flex items-center gap-4 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-[hsl(168_84%_15%)] flex items-center justify-center">
          <Icon name="Shield" size={20} className="text-[hsl(168_84%_52%)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[hsl(168_84%_62%)]">Защита активна</p>
          <p className="text-xs text-[hsl(168_84%_36%)] font-mono-cipher">AES-256-GCM · ECDH · Perfect Forward Secrecy</p>
        </div>
      </div>

      <p className="text-xs text-[hsl(215_12%_40%)] px-2 mb-2 font-semibold uppercase tracking-wider">Безопасность</p>
      <div className="space-y-1 mb-5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[hsl(220_12%_13%)]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(168_84%_12%)]">
            <Icon name="ShieldCheck" size={15} className="text-[hsl(168_84%_52%)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-[hsl(210_20%_92%)]">End-to-End шифрование</p>
            <p className="text-xs text-[hsl(215_12%_42%)]">AES-256-GCM для всех сообщений</p>
          </div>
          <Toggle value={e2e} onChange={() => {}} />
        </div>
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[hsl(220_12%_13%)] hover:bg-[hsl(220_12%_15%)] cursor-pointer transition-all">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(220_12%_18%)]">
            <Icon name="Bell" size={15} className="text-[hsl(215_12%_55%)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-[hsl(210_20%_92%)]">Push-уведомления</p>
            <p className="text-xs text-[hsl(215_12%_42%)]">Новые сообщения</p>
          </div>
          <Toggle value={notifs} onChange={() => setNotifs(!notifs)} />
        </div>
      </div>

      <div className="px-3 py-3 rounded-xl bg-[hsl(220_12%_13%)]">
        <div className="flex items-center gap-3">
          <AvatarCircle initials={currentUser.avatar_initials} online={true} size="md" />
          <div>
            <p className="text-sm font-medium text-[hsl(210_20%_92%)]">{currentUser.display_name}</p>
            <p className="text-xs text-[hsl(215_12%_42%)]">@{currentUser.username}</p>
          </div>
          <button onClick={logout} className="ml-auto text-[hsl(215_12%_40%)] hover:text-[hsl(0_72%_55%)] transition-colors" title="Выйти">
            <Icon name="LogOut" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
