import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_by_session(conn, session_id: str):
    with conn.cursor() as cur:
        cur.execute(
            """SELECT u.id, u.username, u.display_name, u.avatar_initials
               FROM sessions s JOIN users u ON s.user_id = u.id
               WHERE s.id = %s AND s.expires_at > NOW()""",
            (session_id,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "display_name": row[2], "avatar_initials": row[3]}


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def handler(event: dict, context) -> dict:
    """Сообщения: получить историю чата, отправить сообщение"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    headers = event.get("headers") or {}
    params = event.get("queryStringParameters") or {}
    session_id = headers.get("x-session-id") or headers.get("X-Session-Id", "")

    conn = get_conn()

    try:
        user = get_user_by_session(conn, session_id)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

        # GET /?chat_id=X — история сообщений
        if method == "GET":
            chat_id = params.get("chat_id")
            if not chat_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id обязателен"})}

            # Проверяем что пользователь участник чата
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
                if not cur.fetchone():
                    return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}

                cur.execute(
                    """SELECT m.id, m.content, m.sender_id, u.avatar_initials, m.encrypted,
                              to_char(m.created_at, 'HH24:MI') as time
                       FROM messages m
                       LEFT JOIN users u ON u.id = m.sender_id
                       WHERE m.chat_id = %s
                       ORDER BY m.created_at ASC
                       LIMIT 100""",
                    (chat_id,)
                )
                rows = cur.fetchall()

            msgs = [{
                "id": r[0],
                "text": r[1],
                "sender_id": r[2],
                "avatar": r[3] or "??",
                "out": r[2] == user["id"],
                "encrypted": r[4],
                "time": r[5],
            } for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"messages": msgs})}

        # POST / — отправить сообщение
        if method == "POST":
            chat_id = body.get("chat_id")
            content = (body.get("content") or "").strip()
            if not chat_id or not content:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id и content обязательны"})}

            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
                if not cur.fetchone():
                    return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}

                cur.execute(
                    """INSERT INTO messages (chat_id, sender_id, content, encrypted)
                       VALUES (%s, %s, %s, TRUE)
                       RETURNING id, to_char(created_at, 'HH24:MI')""",
                    (chat_id, user["id"], content)
                )
                msg_id, msg_time = cur.fetchone()
            conn.commit()

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "message": {
                    "id": msg_id,
                    "text": content,
                    "sender_id": user["id"],
                    "out": True,
                    "encrypted": True,
                    "time": msg_time,
                }
            })}

        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}

    finally:
        conn.close()
