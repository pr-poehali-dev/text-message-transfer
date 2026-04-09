export type User = { id: number; username: string; display_name: string; avatar_initials: string; status: string };
export type Chat = { id: number; name: string; avatar: string; online: boolean; partner_id: number; last_msg: string; time: string; unread: number; type: string };
export type Message = { id: number; text: string; sender_id: number; out: boolean; encrypted: boolean; time: string; avatar?: string };
export type Tab = "chats" | "contacts" | "notifications" | "search" | "settings";

export const NOTIFICATIONS_STATIC = [
  { id: 1, type: "security", text: "Ключи шифрования инициализированы", time: "сейчас", read: false },
  { id: 2, type: "security", text: "E2E шифрование активно для всех чатов", time: "сейчас", read: false },
];
