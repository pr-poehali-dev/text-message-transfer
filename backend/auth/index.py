import json
import os
import hashlib
import secrets
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_session(conn, user_id: int) -> str:
    session_id = secrets.token_hex(32)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO sessions (id, user_id) VALUES (%s, %s)",
            (session_id, user_id)
        )
    conn.commit()
    return session_id


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
    """Аутентификация: регистрация, вход, выход, получение профиля"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    headers = event.get("headers") or {}
    session_id = headers.get("x-session-id") or headers.get("X-Session-Id", "")

    conn = get_conn()

    try:
        # POST /register
        if method == "POST" and path.endswith("/register"):
            username = body.get("username", "").strip().lower()
            display_name = body.get("display_name", "").strip()
            password = body.get("password", "")
            if not username or not display_name or not password:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Все поля обязательны"})}
            initials = "".join([w[0].upper() for w in display_name.split()[:2]])
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Пользователь уже существует"})}
                cur.execute(
                    "INSERT INTO users (username, display_name, password_hash, avatar_initials, status) VALUES (%s, %s, %s, %s, 'online') RETURNING id",
                    (username, display_name, hash_password(password), initials)
                )
                user_id = cur.fetchone()[0]
            conn.commit()
            sid = create_session(conn, user_id)
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"session_id": sid, "user": {"id": user_id, "username": username, "display_name": display_name, "avatar_initials": initials}})}

        # POST /login
        if method == "POST" and path.endswith("/login"):
            username = body.get("username", "").strip().lower()
            password = body.get("password", "")
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, display_name, avatar_initials FROM users WHERE username = %s AND password_hash = %s",
                    (username, hash_password(password))
                )
                row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный логин или пароль"})}
            cur2 = conn.cursor()
            cur2.execute("UPDATE users SET status = 'online' WHERE id = %s", (row[0],))
            conn.commit()
            cur2.close()
            sid = create_session(conn, row[0])
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"session_id": sid, "user": {"id": row[0], "username": username, "display_name": row[1], "avatar_initials": row[2]}})}

        # GET /me
        if method == "GET" and path.endswith("/me"):
            user = get_user_by_session(conn, session_id)
            if not user:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}

        # POST /logout
        if method == "POST" and path.endswith("/logout"):
            if session_id:
                with conn.cursor() as cur:
                    cur.execute("UPDATE sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
                    with conn.cursor() as cur2:
                        cur2.execute("UPDATE users SET status = 'offline' WHERE id = (SELECT user_id FROM sessions WHERE id = %s)", (session_id,))
                conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # GET /users — список всех пользователей (для контактов)
        if method == "GET" and path.endswith("/users"):
            user = get_user_by_session(conn, session_id)
            if not user:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
            with conn.cursor() as cur:
                cur.execute("SELECT id, username, display_name, avatar_initials, status FROM users WHERE id != %s ORDER BY display_name", (user["id"],))
                rows = cur.fetchall()
            users = [{"id": r[0], "username": r[1], "display_name": r[2], "avatar_initials": r[3], "status": r[4]} for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"users": users})}

        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}

    finally:
        conn.close()
