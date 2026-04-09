import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_by_session(conn, session_id: str):
    with conn.cursor() as cur:
        cur.execute(
            """SELECT u.id, u.username, u.display_name, u.avatar_initials, u.status
               FROM sessions s JOIN users u ON s.user_id = u.id
               WHERE s.id = %s AND s.expires_at > NOW()""",
            (session_id,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "display_name": row[2], "avatar_initials": row[3], "status": row[4]}


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def handler(event: dict, context) -> dict:
    """Управление чатами: список чатов пользователя, создание нового чата"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    headers = event.get("headers") or {}
    session_id = headers.get("x-session-id") or headers.get("X-Session-Id", "")

    conn = get_conn()

    try:
        user = get_user_by_session(conn, session_id)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

        # GET / — список чатов пользователя
        if method == "GET":
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT c.id, c.type, c.name,
                              u.id, u.display_name, u.avatar_initials, u.status,
                              (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg,
                              (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_time,
                              (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != %s) as unread
                       FROM chats c
                       JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = %s
                       LEFT JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id != %s
                       LEFT JOIN users u ON u.id = cm2.user_id
                       ORDER BY last_time DESC NULLS LAST""",
                    (user["id"], user["id"], user["id"])
                )
                rows = cur.fetchall()
            chats = []
            for r in rows:
                chats.append({
                    "id": r[0],
                    "type": r[1],
                    "name": r[4] if r[1] == "direct" else r[2],
                    "avatar": r[5] if r[5] else "??",
                    "online": r[6] == "online" if r[6] else False,
                    "partner_id": r[3],
                    "last_msg": r[7] or "",
                    "time": r[8].strftime("%H:%M") if r[8] else "",
                    "unread": 0,
                })
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"chats": chats})}

        # POST / — создать или найти direct-чат с пользователем
        if method == "POST":
            partner_id = body.get("partner_id")
            chat_name = body.get("name")
            chat_type = body.get("type", "direct")

            if chat_type == "direct" and partner_id:
                # Ищем существующий direct чат между двумя пользователями
                with conn.cursor() as cur:
                    cur.execute(
                        """SELECT c.id FROM chats c
                           JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s
                           JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s
                           WHERE c.type = 'direct' LIMIT 1""",
                        (user["id"], partner_id)
                    )
                    existing = cur.fetchone()
                if existing:
                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"chat_id": existing[0]})}

            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO chats (type, name) VALUES (%s, %s) RETURNING id",
                    (chat_type, chat_name)
                )
                chat_id = cur.fetchone()[0]
                cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, user["id"]))
                if partner_id:
                    cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, partner_id))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"chat_id": chat_id})}

        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}

    finally:
        conn.close()
