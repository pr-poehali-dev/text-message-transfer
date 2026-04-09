import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import type { User } from "./types";

const INPUT_CLS = "w-full bg-[hsl(220_12%_13%)] border border-[hsl(220_12%_19%)] rounded-xl px-4 py-2.5 text-sm text-[hsl(210_20%_92%)] placeholder-[hsl(215_12%_36%)] outline-none focus:border-[hsl(168_84%_28%)] transition-colors";

export function AuthScreen({ onAuth }: { onAuth: (user: User, sid: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (mode === "register" && (!username || !displayName || !email || !password)) {
      setError("Заполните все поля");
      return;
    }
    if (mode === "login" && (!username || !password)) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let data;
      if (mode === "register") {
        data = await api.register(username, displayName, password, email);
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
          <h1 className="text-2xl font-bold text-[hsl(210_20%_92%)]">YANCHAT</h1>
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
            <>
              <div>
                <label className="text-xs text-[hsl(215_12%_48%)] mb-1.5 block">Имя</label>
                <input
                  className={INPUT_CLS}
                  placeholder="Иван Петров"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-[hsl(215_12%_48%)] mb-1.5 block">Email</label>
                <input
                  type="email"
                  className={INPUT_CLS}
                  placeholder="ivan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-[hsl(215_12%_48%)] mb-1.5 block">Логин</label>
            <input
              className={INPUT_CLS}
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
              className={INPUT_CLS}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {mode === "register" && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[hsl(168_84%_8%)] border border-[hsl(168_84%_16%)]">
              <Icon name="Mail" size={13} className="text-[hsl(168_84%_42%)] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[hsl(168_84%_36%)] leading-relaxed">
                После регистрации пароль будет отправлен на указанный email
              </p>
            </div>
          )}

          {error && <p className="text-xs text-[hsl(0_72%_55%)] bg-[hsl(0_72%_10%)] border border-[hsl(0_72%_20%)] rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 bg-[hsl(168_84%_52%)] text-[hsl(220_16%_7%)] font-semibold rounded-xl hover:bg-[hsl(168_84%_60%)] transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "Отправляем письмо..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </div>
      </div>
    </div>
  );
}