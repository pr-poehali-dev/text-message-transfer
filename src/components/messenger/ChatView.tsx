import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import type { Chat, Message, User } from "./types";

export function AvatarCircle({ initials, online, size = "md" }: { initials: string; online?: boolean; size?: "sm" | "md" | "lg" }) {
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

export function EncryptBadge() {
  return (
    <span className="encrypt-badge">
      <Icon name="Lock" size={9} />
      256-bit
    </span>
  );
}

export function ChatsPanel({ chats, onSelect, selected, loading }: { chats: Chat[]; onSelect: (id: number) => void; selected: number | null; loading: boolean }) {
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

export function ChatWindow({ chatId, chats, currentUser, onMessageSent }: { chatId: number | null; chats: Chat[]; currentUser: User; onMessageSent: () => void }) {
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
