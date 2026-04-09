const URLS = {
  auth: "https://functions.poehali.dev/ba472e69-4cde-4c47-9a23-859289f6816e",
  chats: "https://functions.poehali.dev/9df439ec-8c84-45d2-a697-73fb40dc96ef",
  messages: "https://functions.poehali.dev/ba8ffe2d-04b0-419a-91b0-dad995994fae",
};

function getSession(): string {
  return localStorage.getItem("cipher_session") || "";
}

function setSession(sid: string) {
  localStorage.setItem("cipher_session", sid);
}

function clearSession() {
  localStorage.removeItem("cipher_session");
  localStorage.removeItem("cipher_user");
}

async function req(base: keyof typeof URLS, path: string, method = "GET", body?: object) {
  const res = await fetch(`${URLS[base]}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSession(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = JSON.parse(typeof text === "string" && text.startsWith('"') ? JSON.parse(text) : text);
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

export const api = {
  // Auth
  register: (username: string, display_name: string, password: string) =>
    req("auth", "/register", "POST", { username, display_name, password }),

  login: (username: string, password: string) =>
    req("auth", "/login", "POST", { username, password }),

  logout: () => req("auth", "/logout", "POST"),

  me: () => req("auth", "/me", "GET"),

  getUsers: () => req("auth", "/users", "GET"),

  // Chats
  getChats: () => req("chats", "/", "GET"),

  createChat: (partner_id: number) =>
    req("chats", "/", "POST", { partner_id, type: "direct" }),

  // Messages
  getMessages: (chat_id: number) =>
    req("messages", `/?chat_id=${chat_id}`, "GET"),

  sendMessage: (chat_id: number, content: string) =>
    req("messages", "/", "POST", { chat_id, content }),

  // Session helpers
  saveSession: setSession,
  getSession,
  clearSession,
  saveUser: (user: object) => localStorage.setItem("cipher_user", JSON.stringify(user)),
  getSavedUser: () => {
    try { return JSON.parse(localStorage.getItem("cipher_user") || "null"); } catch { return null; }
  },
};
