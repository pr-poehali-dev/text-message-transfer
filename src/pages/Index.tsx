import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";

type User = { id: number; username: string; display_name: string; avatar_initials: string; status: string };
type Chat = { id: number; name: string; avatar: string; online: boolean; partner_id: number; last_msg: string; time: string; unread: number; type: string };
type Message = { id: number; text: string; sender_id: number; out: boolean; encrypted: boolean; time: string; avatar?: string };
type Tab = "chats" | "contacts" | "notifications" | "search" | "settings";

const NOTIFICATIONS_STATIC = [
  { id: 1, type: "security", text: "Ключи шифрования инициализированы", time: "сейчас", read: false },
  { id: 2, type: "security", text: "E2E шифрование активно для всех чатов", time: "сейчас", read: false },
];

function AvatarCircle({ initials, online, size = "md" }: { initials: string; online?: boolean; size?: "sm" | "md" | "lg" }) {
  const sizes: Record<string, string> = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-[hsl(168_60%_25%)] to-[hsl(220_14%_20%)] flex items-center justify-center font-semibold text-[hsl(168_84%_60%)] border border-[hsl(168_84%_20%)]`}>
        {(initials || "??").slice(0, 2)}
      </div>
      {online !== undefined && (
        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[hsl(220_16%_7%)] ${online ? "bg-[hsl(168_84%_52%)]" : "bg-[hsl(215_12%_32%)]"}`} />
      )}
    </div>
  );
}

function EncryptBadge() {
  return (
    <span className="encrypt-badge">
      <Icon name="Lock" size={9} />
      256-bit
    </span>
  );
}

// ─── Auth Screen ────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (user: User, sid: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username || !password || (mode === "register" && !displayName)) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let data;
      if (mode === "register") {
        data = await api.register(username, displayName, password);
      } else {
        data = await api.login(username, password);
      }
      api.saveSession(data.session_id);
      api.saveUser(data.user);
      onAuth(data.user, data.session_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[hsl(220_16%_7%)]">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(168_84%_10%)] border border-[hsl(168_84%_22%)] flex items-center justify-center mb-4 glow-green">
            <Icon name="ShieldCheck" size={28} className="text-[hsl(168_84%_52%)]" />
          </div>
          <h1 className="text-2xl font-bold text-[hsl(210_20%_92%)]">Cipher</h1>
          <p className="text-sm text-[hsl(215_12%_48%)] mt-1 font-mono-cipher">AES-256-GCM · E2E Encrypted</p>
        </div>

        <div className="bg-[hsl(220_14%_10%)] border border-[hsl(220_12%_17%)] rounded-2xl p-6 space-y-3">
          <div className="flex bg-[hsl(220_12%_13%)] rounded-xl p-1 mb-4">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-all ${mode === m ? "bg-[hsl(168_84%_52%)] text-[hsl(220_16%_7%)]" : "text-[hsl(215_12%_48%)] hover:text-[hsl(210_20%_92%)]"}`}
              >
                {m === "login" ? "Войти" : "Создать аккаунт"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <div>
              <label className="text-xs text-[hsl(215_12%_48%)] mb-1.5 block">Имя</label>
              <input
                className="w-full bg-[hsl(220_12%_13%)] border border-[hsl(220_12%_19%)] rounded-xl px-4 py-2.5 text-sm text-[hsl(210_20%_92%)] placeholder-[hsl(215_12%_36%)] outline-none focus:border-[hsl(168_84%_28%)] transition-colors"
                placeholder="Иван Петров"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="text-xs text-[hsl(215_12%_48%)] mb-1.5 block">Логин</label>
            <input
              className="w-full bg-[hsl(220_12%_13%)] border border-[hsl(220_12%_19%)] rounded-xl px-4 py-2.5 text-sm text-[hsl(210_20%_92%)] placeholder-[hsl(215_12%_36%)] outline-none focus:border-[hsl(168_84%_28%)] transition-colors"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div>
            <label className="text-xs text-[hsl(215_12%_48%)] mb-1.5 block">Пароль</label>
            <input
              type="password"
              className="w-full bg-[hsl(220_12%_13%)] border border-[hsl(220_12%_19%)] rounded-xl px-4 py-2.5 text-sm text-[hsl(210_20%_92%)] placeholder-[hsl(215_12%_36%)] outline-none focus:border-[hsl(168_84%_28%)] transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {error && <p className="text-xs text-[hsl(0_72%_55%)] bg-[hsl(0_72%_10%)] border border-[hsl(0_72%_20%)] rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 bg-[hsl(168_84%_52%)] text-[hsl(220_16%_7%)] font-semibold rounded-xl hover:bg-[hsl(168_84%_60%)] transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chats Panel ─────────────────────────────────────────────────────────────
function ChatsPanel({ chats, onSelect, selected, loading }: { chats: Chat[]; onSelect: (id: number) => void; selected: number | null; loading: boolean }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-lg font-semibold text-[hsl(210_20%_92%)]">Сообщения</h2>
        <p className="text-xs text-[hsl(215_12%_48%)] mt-0.5 flex items-center gap-1.5">
          <Icon name="ShieldCheck" size={11} />
          Все чаты защищены E2E шифрованием
        </p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0.5 px-2">
        {loading && (
          <div className="flex flex-col gap-2 px-2 pt-2">
            {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-[hsl(220_12%_13%)] animate-pulse" />)}
          </div>
        )}
        {!loading && chats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-[hsl(215_12%_40%)] text-sm">
            Нет чатов. Начните переписку из Контактов
          </div>
        )}
        {chats.map((chat, i) => (
          <div
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={`chat-item animate-slide-in ${selected === chat.id ? "selected" : ""}`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <AvatarCircle initials={chat.avatar} online={chat.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-[hsl(210_20%_92%)] truncate">{chat.name}</span>
                <span className="text-xs text-[hsl(215_12%_40%)] ml-2 flex-shrink-0">{chat.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-[hsl(215_12%_48%)] truncate">{chat.last_msg || "Нет сообщений"}</span>
                {chat.unread > 0 && (
                  <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-[hsl(168_84%_52%)] text-[hsl(220_16%_7%)] text-xs font-bold flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat Window ─────────────────────────────────────────────────────────────
function ChatWindow({ chatId, chats, currentUser, onMessageSent }: { chatId: number | null; chats: Chat[]; currentUser: User; onMessageSent: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    try {
      const data = await api.getMessages(chatId);
      setMessages(data.messages || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    setMessages([]);
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-8">
        <div className="w-16 h-16 rounded-2xl bg-[hsl(168_84%_10%)] border border-[hsl(168_84%_20%)] flex items-center justify-center">
          <Icon name="MessageSquare" size={28} className="text-[hsl(168_84%_42%)]" />
        </div>
        <div>
          <p className="font-semibold text-[hsl(210_20%_75%)]">Выберите чат</p>
          <p className="text-sm text-[hsl(215_12%_40%)] mt-1">Все сообщения защищены<br />шифрованием AES-256</p>
        </div>
        <EncryptBadge />
      </div>
    );
  }

  const chat = chats.find((c) => c.id === chatId);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const data = await api.sendMessage(chatId, text);
      setMessages((prev) => [...prev, data.message]);
      onMessageSent();
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[hsl(220_12%_17%)]">
        <AvatarCircle initials={chat?.avatar || "??"} online={chat?.online} size="md" />
        <div className="flex-1">
          <p className="font-semibold text-[hsl(210_20%_92%)] text-sm">{chat?.name || "Чат"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${chat?.online ? "text-[hsl(168_84%_42%)]" : "text-[hsl(215_12%_40%)]"}`}>
              {chat?.online ? "онлайн" : "не в сети"}
            </span>
            <span className="text-[hsl(215_12%_30%)]">·</span>
            <EncryptBadge />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-2">
        {loading && <div className="flex justify-center py-4"><div className="w-5 h-5 rounded-full border-2 border-[hsl(168_84%_52%)] border-t-transparent animate-spin" /></div>}
        {messages.map((msg, i) => (
          <div key={msg.id} className={`flex ${msg.out ? "justify-end" : "justify-start"} animate-fade-in`} style={{ animationDelay: `${Math.min(i, 5) * 30}ms` }}>
            <div className={`max-w-[72%] ${msg.out ? "msg-bubble-out" : "msg-bubble-in"} px-4 py-2.5`}>
              <p className="text-sm text-[hsl(210_20%_92%)] leading-relaxed">{msg.text}</p>
              <div className={`flex items-center gap-1.5 mt-1 ${msg.out ? "justify-end" : "justify-start"}`}>
                <span className="text-[10px] text-[hsl(215_12%_40%)]">{msg.time}</span>
                {msg.encrypted && <Icon name="Lock" size={9} className="text-[hsl(168_84%_36%)]" />}
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-24 text-[hsl(215_12%_40%)] text-sm">
            Начните переписку — она будет зашифрована
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[hsl(220_12%_17%)]">
        <div className="flex items-center gap-2 bg-[hsl(220_12%_13%)] rounded-xl px-4 py-2.5 border border-[hsl(220_12%_19%)] focus-within:border-[hsl(168_84%_28%)] transition-colors">
          <Icon name="Lock" size={14} className="text-[hsl(168_84%_36%)] flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-[hsl(210_20%_92%)] placeholder-[hsl(215_12%_36%)] outline-none"
            placeholder="Зашифрованное сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-7 h-7 rounded-lg bg-[hsl(168_84%_52%)] flex items-center justify-center text-[hsl(220_16%_7%)] hover:bg-[hsl(168_84%_60%)] transition-colors disabled:opacity-40"
          >
            {sending ? <div className="w-3 h-3 border border-[hsl(220_16%_7%)] border-t-transparent rounded-full animate-spin" /> : <Icon name="Send" size={13} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-[hsl(215_12%_32%)] mt-1.5 font-mono-cipher">AES-256-GCM · E2E encrypted</p>
      </div>
    </div>
  );
}

// ─── Contacts Panel ───────────────────────────────────────────────────────────
function ContactsPanel({ currentUser, onStartChat }: { currentUser: User; onStartChat: (chatId: number) => void }) {
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

// ─── Notifications Panel ──────────────────────────────────────────────────────
function NotificationsPanel() {
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

// ─── Search Panel ─────────────────────────────────────────────────────────────
function SearchPanel({ chats }: { chats: Chat[] }) {
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

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ currentUser, onLogout }: { currentUser: User; onLogout: () => void }) {
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

// ─── Main ─────────────────────────────────────────────────────────────────────
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
