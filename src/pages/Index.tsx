import { useState } from "react";
import Icon from "@/components/ui/icon";

const CONTACTS = [
  { id: 1, name: "Анна Петрова", status: "online", avatar: "АП", lastSeen: "сейчас" },
  { id: 2, name: "Михаил Соколов", status: "offline", avatar: "МС", lastSeen: "1 ч назад" },
  { id: 3, name: "Елена Новикова", status: "online", avatar: "ЕН", lastSeen: "сейчас" },
  { id: 4, name: "Дмитрий Ким", status: "away", avatar: "ДК", lastSeen: "5 мин назад" },
  { id: 5, name: "Ольга Смирнова", status: "online", avatar: "ОС", lastSeen: "сейчас" },
  { id: 6, name: "Александр Волков", status: "offline", avatar: "АВ", lastSeen: "вчера" },
];

const CHATS = [
  {
    id: 1,
    name: "Анна Петрова",
    avatar: "АП",
    lastMsg: "Хорошо, увидимся завтра!",
    time: "14:32",
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: "Привет! Как дела?", out: false, time: "14:28", encrypted: true },
      { id: 2, text: "Всё отлично, спасибо! А у тебя?", out: true, time: "14:29", encrypted: true },
      { id: 3, text: "Тоже хорошо. Ты свободна завтра?", out: true, time: "14:30", encrypted: true },
      { id: 4, text: "Да, с утра точно свободна.", out: false, time: "14:31", encrypted: true },
      { id: 5, text: "Хорошо, увидимся завтра!", out: false, time: "14:32", encrypted: true },
    ],
  },
  {
    id: 2,
    name: "Михаил Соколов",
    avatar: "МС",
    lastMsg: "Документы отправил на почту",
    time: "12:15",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Привет, документы готовы?", out: true, time: "12:10", encrypted: true },
      { id: 2, text: "Да, сейчас пришлю", out: false, time: "12:12", encrypted: true },
      { id: 3, text: "Документы отправил на почту", out: false, time: "12:15", encrypted: true },
    ],
  },
  {
    id: 3,
    name: "Рабочий чат",
    avatar: "РЧ",
    lastMsg: "Встреча в 15:00",
    time: "11:00",
    unread: 5,
    online: true,
    messages: [
      { id: 1, text: "Всем привет!", out: false, time: "10:50", encrypted: true },
      { id: 2, text: "Встреча в 15:00", out: false, time: "11:00", encrypted: true },
    ],
  },
  {
    id: 4,
    name: "Елена Новикова",
    avatar: "ЕН",
    lastMsg: "Спасибо за помощь!",
    time: "вчера",
    unread: 0,
    online: true,
    messages: [
      { id: 1, text: "Можешь помочь с задачей?", out: false, time: "вчера", encrypted: true },
      { id: 2, text: "Конечно, пиши!", out: true, time: "вчера", encrypted: true },
      { id: 3, text: "Спасибо за помощь!", out: false, time: "вчера", encrypted: true },
    ],
  },
];

const NOTIFICATIONS = [
  { id: 1, type: "message", text: "Анна Петрова прислала сообщение", time: "14:32", read: false },
  { id: 2, type: "security", text: "Новый вход в аккаунт с устройства iPhone 15", time: "13:10", read: false },
  { id: 3, type: "contact", text: "Михаил Соколов принял ваш запрос", time: "12:00", read: true },
  { id: 4, type: "message", text: "5 новых сообщений в Рабочем чате", time: "11:00", read: true },
  { id: 5, type: "security", text: "Ключи шифрования обновлены успешно", time: "вчера", read: true },
];

type Tab = "chats" | "contacts" | "notifications" | "search" | "settings";

function AvatarCircle({ initials, online, size = "md" }: { initials: string; online?: boolean; size?: "sm" | "md" | "lg" }) {
  const sizes: Record<string, string> = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-[hsl(168_60%_25%)] to-[hsl(220_14%_20%)] flex items-center justify-center font-semibold text-[hsl(168_84%_60%)] border border-[hsl(168_84%_20%)]`}>
        {initials}
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

function ChatsPanel({ onSelect, selected }: { onSelect: (id: number) => void; selected: number | null }) {
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
        {CHATS.map((chat, i) => (
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
                <span className="text-xs text-[hsl(215_12%_48%)] truncate">{chat.lastMsg}</span>
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

function ChatWindow({ chatId }: { chatId: number | null }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ [key: number]: typeof CHATS[0]["messages"] }>(
    Object.fromEntries(CHATS.map((c) => [c.id, c.messages]))
  );

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

  const chat = CHATS.find((c) => c.id === chatId)!;
  const msgs = messages[chatId] || [];

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), {
        id: Date.now(),
        text: input,
        out: true,
        time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
        encrypted: true
      }],
    }));
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[hsl(220_12%_17%)]">
        <AvatarCircle initials={chat.avatar} online={chat.online} size="md" />
        <div className="flex-1">
          <p className="font-semibold text-[hsl(210_20%_92%)] text-sm">{chat.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${chat.online ? "text-[hsl(168_84%_42%)]" : "text-[hsl(215_12%_40%)]"}`}>
              {chat.online ? "онлайн" : "не в сети"}
            </span>
            <span className="text-[hsl(215_12%_30%)]">·</span>
            <EncryptBadge />
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(215_12%_48%)] hover:text-[hsl(210_20%_92%)] hover:bg-[hsl(220_12%_15%)] transition-all">
          <Icon name="MoreVertical" size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-2">
        {msgs.map((msg, i) => (
          <div key={msg.id} className={`flex ${msg.out ? "justify-end" : "justify-start"} animate-fade-in`} style={{ animationDelay: `${i * 30}ms` }}>
            <div className={`max-w-[72%] ${msg.out ? "msg-bubble-out" : "msg-bubble-in"} px-4 py-2.5`}>
              <p className="text-sm text-[hsl(210_20%_92%)] leading-relaxed">{msg.text}</p>
              <div className={`flex items-center gap-1.5 mt-1 ${msg.out ? "justify-end" : "justify-start"}`}>
                <span className="text-[10px] text-[hsl(215_12%_40%)]">{msg.time}</span>
                {msg.encrypted && (
                  <Icon name="Lock" size={9} className="text-[hsl(168_84%_36%)]" />
                )}
              </div>
            </div>
          </div>
        ))}
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
            className="w-7 h-7 rounded-lg bg-[hsl(168_84%_52%)] flex items-center justify-center text-[hsl(220_16%_7%)] hover:bg-[hsl(168_84%_60%)] transition-colors disabled:opacity-40"
            disabled={!input.trim()}
          >
            <Icon name="Send" size={13} />
          </button>
        </div>
        <p className="text-center text-[10px] text-[hsl(215_12%_32%)] mt-1.5 font-mono-cipher">AES-256-GCM · E2E encrypted</p>
      </div>
    </div>
  );
}

function ContactsPanel() {
  const online = CONTACTS.filter((c) => c.status === "online");
  const offline = CONTACTS.filter((c) => c.status !== "online");
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
      <h2 className="text-lg font-semibold text-[hsl(210_20%_92%)] px-2 mb-4">Контакты</h2>
      <p className="text-xs text-[hsl(168_84%_42%)] px-2 mb-3 font-semibold uppercase tracking-wider">Онлайн — {online.length}</p>
      <div className="space-y-0.5 mb-6">
        {online.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(220_12%_13%)] cursor-pointer transition-all animate-slide-in" style={{ animationDelay: `${i * 40}ms` }}>
            <AvatarCircle initials={c.avatar} online={true} />
            <div>
              <p className="text-sm font-medium text-[hsl(210_20%_92%)]">{c.name}</p>
              <p className="text-xs text-[hsl(168_84%_42%)]">онлайн</p>
            </div>
            <button className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(215_12%_48%)] hover:text-[hsl(168_84%_52%)] hover:bg-[hsl(168_84%_10%)] transition-all">
              <Icon name="MessageSquare" size={14} />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-[hsl(215_12%_40%)] px-2 mb-3 font-semibold uppercase tracking-wider">Не в сети — {offline.length}</p>
      <div className="space-y-0.5">
        {offline.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(220_12%_13%)] cursor-pointer transition-all animate-slide-in" style={{ animationDelay: `${(online.length + i) * 40}ms` }}>
            <AvatarCircle initials={c.avatar} online={false} />
            <div>
              <p className="text-sm font-medium text-[hsl(210_20%_75%)]">{c.name}</p>
              <p className="text-xs text-[hsl(215_12%_40%)]">{c.lastSeen}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const icons: Record<string, string> = { message: "MessageSquare", security: "ShieldAlert", contact: "UserPlus" };
  const colors: Record<string, string> = { message: "168 84% 42%", security: "38 92% 55%", contact: "210 84% 62%" };
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
      <div className="flex items-center justify-between px-2 mb-4">
        <h2 className="text-lg font-semibold text-[hsl(210_20%_92%)]">Уведомления</h2>
        <button className="text-xs text-[hsl(168_84%_42%)] hover:text-[hsl(168_84%_60%)] transition-colors">Прочитать все</button>
      </div>
      <div className="space-y-1.5">
        {NOTIFICATIONS.map((n, i) => (
          <div key={n.id} className={`flex items-start gap-3 px-3 py-3 rounded-xl transition-all animate-fade-in cursor-pointer ${n.read ? "opacity-50 hover:opacity-70" : "bg-[hsl(220_12%_13%)] hover:bg-[hsl(220_12%_15%)]"}`} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `hsl(${colors[n.type]} / 0.12)` }}>
              <Icon name={icons[n.type]} size={15} style={{ color: `hsl(${colors[n.type]})` }} />
            </div>
            <div className="flex-1 min-w-0">
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

function SearchPanel() {
  const [query, setQuery] = useState("");
  const results = query.length > 1
    ? CHATS.flatMap((c) =>
        c.messages
          .filter((m) => m.text.toLowerCase().includes(query.toLowerCase()))
          .map((m) => ({ chat: c.name, avatar: c.avatar, text: m.text, time: m.time }))
      )
    : [];

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
        {query && (
          <button onClick={() => setQuery("")} className="text-[hsl(215_12%_40%)] hover:text-[hsl(210_20%_75%)] transition-colors">
            <Icon name="X" size={14} />
          </button>
        )}
      </div>

      {query.length > 1 && (
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[hsl(215_12%_40%)]">
              <Icon name="SearchX" size={28} className="mb-2 opacity-50" />
              <p className="text-sm">Ничего не найдено</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {results.map((r, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-xl bg-[hsl(220_12%_13%)] hover:bg-[hsl(220_12%_15%)] cursor-pointer transition-all animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
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
            </div>
          )}
        </div>
      )}

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

function SettingsPanel() {
  const [e2e, setE2e] = useState(true);
  const [notifs, setNotifs] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      style={{ width: "40px", height: "22px" }}
      className={`relative rounded-full transition-colors duration-200 ${value ? "bg-[hsl(168_84%_52%)]" : "bg-[hsl(220_12%_20%)]"}`}
    >
      <div
        style={{ width: "18px", height: "18px" }}
        className={`absolute top-0.5 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );

  const sections = [
    {
      title: "Безопасность",
      items: [
        { icon: "ShieldCheck", label: "End-to-End шифрование", desc: "AES-256-GCM для всех сообщений", value: e2e as boolean | null, toggle: () => setE2e(!e2e), accent: true },
        { icon: "Key", label: "Обновить ключи шифрования", desc: "Последнее обновление: сегодня", value: null as boolean | null, toggle: () => {}, accent: false },
        { icon: "Fingerprint", label: "Двухфакторная аутентификация", desc: "Дополнительная защита аккаунта", value: null as boolean | null, toggle: () => {}, accent: false },
      ]
    },
    {
      title: "Уведомления",
      items: [
        { icon: "Bell", label: "Push-уведомления", desc: "Новые сообщения и события", value: notifs as boolean | null, toggle: () => setNotifs(!notifs), accent: false },
        { icon: "Trash2", label: "Автоудаление сообщений", desc: "Через 7 дней после прочтения", value: autoDelete as boolean | null, toggle: () => setAutoDelete(!autoDelete), accent: false },
      ]
    }
  ];

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

      {sections.map((section, si) => (
        <div key={si} className="mb-5">
          <p className="text-xs text-[hsl(215_12%_40%)] px-2 mb-2 font-semibold uppercase tracking-wider">{section.title}</p>
          <div className="space-y-1">
            {section.items.map((item, ii) => (
              <div
                key={ii}
                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[hsl(220_12%_13%)] hover:bg-[hsl(220_12%_15%)] transition-all animate-slide-in cursor-pointer"
                style={{ animationDelay: `${(si * 3 + ii) * 50}ms` }}
                onClick={item.value !== null ? item.toggle : undefined}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.accent ? "bg-[hsl(168_84%_12%)]" : "bg-[hsl(220_12%_18%)]"}`}>
                  <Icon name={item.icon} size={15} className={item.accent ? "text-[hsl(168_84%_52%)]" : "text-[hsl(215_12%_55%)]"} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[hsl(210_20%_92%)]">{item.label}</p>
                  <p className="text-xs text-[hsl(215_12%_42%)]">{item.desc}</p>
                </div>
                {item.value !== null ? (
                  <Toggle value={item.value} onChange={item.toggle} />
                ) : (
                  <Icon name="ChevronRight" size={14} className="text-[hsl(215_12%_40%)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="px-3 py-3 rounded-xl bg-[hsl(220_12%_13%)] mt-2">
        <div className="flex items-center gap-3">
          <AvatarCircle initials="ВП" online={true} size="md" />
          <div>
            <p className="text-sm font-medium text-[hsl(210_20%_92%)]">Владимир Петров</p>
            <p className="text-xs text-[hsl(215_12%_42%)]">vladimir@cipher.app</p>
          </div>
          <button className="ml-auto text-[hsl(215_12%_40%)] hover:text-[hsl(0_72%_55%)] transition-colors">
            <Icon name="LogOut" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [tab, setTab] = useState<Tab>("chats");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  const navItems: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "chats", icon: "MessageSquare", label: "Чаты", badge: CHATS.reduce((s, c) => s + c.unread, 0) },
    { id: "contacts", icon: "Users", label: "Контакты" },
    { id: "notifications", icon: "Bell", label: "Центр", badge: NOTIFICATIONS.filter((n) => !n.read).length },
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
            <ChatsPanel onSelect={setSelectedChat} selected={selectedChat} />
          </div>
          <ChatWindow chatId={selectedChat} />
        </>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === "contacts" && <ContactsPanel />}
          {tab === "notifications" && <NotificationsPanel />}
          {tab === "search" && <SearchPanel />}
          {tab === "settings" && <SettingsPanel />}
        </div>
      )}
    </div>
  );
}