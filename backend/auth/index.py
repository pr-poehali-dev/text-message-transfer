import json
import os
import hashlib
import secrets as secrets_module
import urllib.request

import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_session(conn, user_id: int) -> str:
    session_id = secrets_module.token_hex(32)
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


def send_welcome_email(to_email: str, display_name: str, username: str, password: str):
    brevo_api_key = os.environ["BREVO_API_KEY"]
    smtp_email = os.environ.get("SMTP_EMAIL", "noreply@yanchat.ru")

    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#13161e;border-radius:16px;border:1px solid #1e2330;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #1e2330;">
            <div style="width:56px;height:56px;background:#0d2e24;border:1px solid #1a5c42;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:24px;">&#128272;</span>
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#edf0f5;">YANCHAT</h1>
            <p style="margin:6px 0 0;font-size:12px;color:#4a5568;font-family:monospace;">AES-256-GCM · E2E Encrypted</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#c8d0dc;">Привет, <strong style="color:#edf0f5;">{display_name}</strong>!</p>
            <p style="margin:0 0 24px;font-size:14px;color:#8896aa;line-height:1.6;">
              Вы успешно зарегистрировались в YANCHAT — защищённом мессенджере с шифрованием AES-256-GCM.
            </p>
            <div style="background:#0d1520;border:1px solid #1e2d3d;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:11px;color:#4a5568;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Логин</p>
              <p style="margin:0 0 16px;font-size:16px;color:#edf0f5;font-family:monospace;">{username}</p>
              <p style="margin:0 0 4px;font-size:11px;color:#4a5568;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Пароль</p>
              <p style="margin:0;font-size:16px;color:#2dd4a0;font-family:monospace;font-weight:600;">{password}</p>
            </div>
            <div style="background:#0d1e16;border:1px solid #1a3a28;border-radius:10px;padding:14px 18px;">
              <p style="margin:0;font-size:12px;color:#2d7a58;line-height:1.5;">
                &#128274; Сохраните это письмо — пароль больше не будет отправлен повторно.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #1e2330;">
            <p style="margin:0;font-size:12px;color:#2d3748;">YANCHAT · Все сообщения зашифрованы</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    text_body = f"Привет, {display_name}!\n\nЛогин: {username}\nПароль: {password}\n\nСохраните это письмо.\n\nКоманда YANCHAT"

    payload = json.dumps({
        "sender": {"name": "YANCHAT", "email": smtp_email},
        "to": [{"email": to_email}],
        "subject": "Добро пожаловать в YANCHAT — ваши данные для входа",
        "htmlContent": html_body,
        "textContent": text_body,
        "headers": {"Disposition-Notification-To": smtp_email}
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        headers={
            "api-key": brevo_api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        resp.read()


def send_reset_email(to_email: str, display_name: str, username: str, new_password: str):
    brevo_api_key = os.environ["BREVO_API_KEY"]
    smtp_email = os.environ.get("SMTP_EMAIL", "noreply@yanchat.ru")

    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#13161e;border-radius:16px;border:1px solid #1e2330;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #1e2330;">
            <div style="width:56px;height:56px;background:#2e1a0d;border:1px solid #5c3a1a;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:24px;">&#128273;</span>
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#edf0f5;">YANCHAT</h1>
            <p style="margin:6px 0 0;font-size:12px;color:#4a5568;font-family:monospace;">Восстановление пароля</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#c8d0dc;">Привет, <strong style="color:#edf0f5;">{display_name}</strong>!</p>
            <p style="margin:0 0 24px;font-size:14px;color:#8896aa;line-height:1.6;">
              Мы сбросили ваш пароль по запросу. Вот новые данные для входа:
            </p>
            <div style="background:#0d1520;border:1px solid #1e2d3d;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:11px;color:#4a5568;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Логин</p>
              <p style="margin:0 0 16px;font-size:16px;color:#edf0f5;font-family:monospace;">{username}</p>
              <p style="margin:0 0 4px;font-size:11px;color:#4a5568;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Новый пароль</p>
              <p style="margin:0;font-size:16px;color:#d4a02d;font-family:monospace;font-weight:600;">{new_password}</p>
            </div>
            <div style="background:#1e1508;border:1px solid #3a2a10;border-radius:10px;padding:14px 18px;">
              <p style="margin:0;font-size:12px;color:#7a5a20;line-height:1.5;">
                &#128274; Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #1e2330;">
            <p style="margin:0;font-size:12px;color:#2d3748;">YANCHAT · Все сообщения зашифрованы</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    text_body = f"Привет, {display_name}!\n\nВаш новый пароль:\nЛогин: {username}\nПароль: {new_password}\n\nЕсли вы не запрашивали сброс — проигнорируйте это письмо.\n\nКоманда YANCHAT"

    payload = json.dumps({
        "sender": {"name": "YANCHAT", "email": smtp_email},
        "to": [{"email": to_email}],
        "subject": "Восстановление пароля YANCHAT",
        "htmlContent": html_body,
        "textContent": text_body
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        headers={
            "api-key": brevo_api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        resp.read()


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def handler(event: dict, context) -> dict:
    """Аутентификация: регистрация (с отправкой пароля на email), вход, выход, профиль"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    headers = event.get("headers") or {}
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    session_id = headers.get("x-session-id") or headers.get("X-Session-Id", "")

    conn = get_conn()

    try:
        # POST register
        if method == "POST" and action == "register":
            username = body.get("username", "").strip().lower()
            display_name = body.get("display_name", "").strip()
            password = body.get("password", "")
            email = body.get("email", "").strip().lower()
            if not username or not display_name or not password or not email:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Все поля обязательны"})}
            initials = "".join([w[0].upper() for w in display_name.split()[:2]])
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Пользователь уже существует"})}
                cur.execute(
                    "INSERT INTO users (username, display_name, password_hash, avatar_initials, status, email) VALUES (%s, %s, %s, %s, 'online', %s) RETURNING id",
                    (username, display_name, hash_password(password), initials, email)
                )
                user_id = cur.fetchone()[0]
            conn.commit()
            sid = create_session(conn, user_id)

            try:
                send_welcome_email(email, display_name, username, password)
            except Exception:
                pass

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"session_id": sid, "user": {"id": user_id, "username": username, "display_name": display_name, "avatar_initials": initials}})}

        # POST login
        if method == "POST" and action == "login":
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

        # GET me
        if method == "GET" and action == "me":
            user = get_user_by_session(conn, session_id)
            if not user:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}

        # POST logout
        if method == "POST" and action == "logout":
            if session_id:
                with conn.cursor() as cur:
                    cur.execute("UPDATE sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
                    with conn.cursor() as cur2:
                        cur2.execute("UPDATE users SET status = 'offline' WHERE id = (SELECT user_id FROM sessions WHERE id = %s)", (session_id,))
                conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # POST forgot_password
        if method == "POST" and action == "forgot_password":
            email = body.get("email", "").strip().lower()
            if not email:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "email обязателен"})}
            with conn.cursor() as cur:
                cur.execute("SELECT username, display_name, password_hash FROM users WHERE email = %s", (email,))
                row = cur.fetchone()
            if not row:
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}
            username, display_name, _ = row
            new_password = secrets_module.token_urlsafe(10)
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET password_hash = %s WHERE email = %s", (hash_password(new_password), email))
            conn.commit()
            send_reset_email(email, display_name, username, new_password)
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # POST send_test_email
        if method == "POST" and action == "send_test_email":
            to_email = body.get("email", "").strip()
            if not to_email:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "email обязателен"})}
            send_welcome_email(to_email, "Тест", "testuser", "p@ssw0rd_test")
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "sent_to": to_email})}

        # GET users
        if method == "GET" and action == "users":
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