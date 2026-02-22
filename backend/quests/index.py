"""
API для управления квестами: получение веток/квестов, прогресс игроков, CRUD для админа.
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p88778265_quest_book_server")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
}

def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def is_admin(event):
    key = event.get("headers", {}).get("X-Admin-Key", "")
    return key == os.environ.get("ADMIN_KEY", "")

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor()

    # GET / — все ветки с квестами
    if method == "GET" and path in ("/", ""):
        cur.execute(f"""
            SELECT b.id, b.title, b.icon, b.color, b.description, b.sort_order,
                   json_agg(
                       json_build_object(
                           'id', q.id, 'title', q.title, 'description', q.description,
                           'reward', q.reward, 'xp', q.xp, 'rarity', q.rarity,
                           'icon', q.icon, 'sort_order', q.sort_order
                       ) ORDER BY q.sort_order
                   ) FILTER (WHERE q.id IS NOT NULL AND q.archived = FALSE) as quests
            FROM {SCHEMA}.branches b
            LEFT JOIN {SCHEMA}.quests q ON q.branch_id = b.id
            WHERE b.archived = FALSE
            GROUP BY b.id ORDER BY b.sort_order
        """)
        rows = cur.fetchall()
        result = [{"id": r[0], "title": r[1], "icon": r[2], "color": r[3],
                   "description": r[4], "sort_order": r[5], "quests": r[6] or []} for r in rows]
        return ok(result)

    # GET /progress?nick=Steve
    if method == "GET" and path == "/progress":
        nick = params.get("nick", "").strip()
        if not nick:
            return err("nick required")
        cur.execute(f"SELECT quest_id FROM {SCHEMA}.player_progress WHERE player_nick = %s", (nick,))
        ids = [row[0] for row in cur.fetchall()]
        return ok({"nick": nick, "completed_quest_ids": ids})

    # POST /progress — выполнить квест
    if method == "POST" and path == "/progress":
        nick = body.get("nick", "").strip()
        quest_id = body.get("quest_id")
        if not nick or not quest_id:
            return err("nick and quest_id required")
        cur.execute(f"SELECT id FROM {SCHEMA}.quests WHERE id = %s AND archived = FALSE", (quest_id,))
        if not cur.fetchone():
            return err("quest not found", 404)
        cur.execute(f"""
            INSERT INTO {SCHEMA}.player_progress (player_nick, quest_id)
            VALUES (%s, %s) ON CONFLICT DO NOTHING
        """, (nick, quest_id))
        cur.execute(f"SELECT title, xp, rarity FROM {SCHEMA}.quests WHERE id = %s", (quest_id,))
        q = cur.fetchone()

        webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "")
        if webhook_url and q:
            import urllib.request
            rarity_emoji = {"common": "⚪", "rare": "🔵", "epic": "🟣"}.get(q[2], "⭐")
            payload = json.dumps({"embeds": [{"title": "Квест выполнен!", "color": 0xF0C040, "fields": [
                {"name": "Игрок", "value": f"**{nick}**", "inline": True},
                {"name": "Квест", "value": f"{rarity_emoji} {q[0]}", "inline": True},
                {"name": "Опыт", "value": f"+{q[1]} XP", "inline": True},
            ], "footer": {"text": "Quest Book Server"}}]}).encode()
            req = urllib.request.Request(webhook_url, data=payload, headers={"Content-Type": "application/json"})
            try:
                urllib.request.urlopen(req, timeout=3)
            except Exception:
                pass

        return ok({"success": True, "quest_title": q[0] if q else "", "xp": q[1] if q else 0})

    # ADMIN: POST /branches
    if method == "POST" and path == "/branches":
        if not is_admin(event):
            return err("unauthorized", 401)
        cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.branches WHERE archived=FALSE")
        next_order = cur.fetchone()[0]
        cur.execute(f"""
            INSERT INTO {SCHEMA}.branches (title, icon, color, description, sort_order)
            VALUES (%s,%s,%s,%s,%s) RETURNING id
        """, (body.get("title","Новая ветка"), body.get("icon","Star"),
              body.get("color","#c0a830"), body.get("description",""), next_order))
        return ok({"id": cur.fetchone()[0]})

    # ADMIN: PUT /branches
    if method == "PUT" and path == "/branches":
        if not is_admin(event):
            return err("unauthorized", 401)
        cur.execute(f"""
            UPDATE {SCHEMA}.branches SET title=%s, icon=%s, color=%s, description=%s WHERE id=%s
        """, (body.get("title"), body.get("icon"), body.get("color"), body.get("description"), body.get("id")))
        return ok({"success": True})

    # ADMIN: POST /branches/remove
    if method == "POST" and path == "/branches/remove":
        if not is_admin(event):
            return err("unauthorized", 401)
        bid = body.get("id")
        cur.execute(f"UPDATE {SCHEMA}.branches SET archived=TRUE WHERE id=%s", (bid,))
        cur.execute(f"UPDATE {SCHEMA}.quests SET archived=TRUE WHERE branch_id=%s", (bid,))
        return ok({"success": True})

    # ADMIN: POST /quests
    if method == "POST" and path == "/quests":
        if not is_admin(event):
            return err("unauthorized", 401)
        branch_id = body.get("branch_id")
        cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.quests WHERE branch_id=%s AND archived=FALSE", (branch_id,))
        next_order = cur.fetchone()[0]
        cur.execute(f"""
            INSERT INTO {SCHEMA}.quests (branch_id, title, description, reward, xp, rarity, icon, sort_order)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (branch_id, body.get("title","Новый квест"), body.get("description",""),
              body.get("reward",""), int(body.get("xp",100)), body.get("rarity","common"),
              body.get("icon","Star"), next_order))
        return ok({"id": cur.fetchone()[0]})

    # ADMIN: PUT /quests
    if method == "PUT" and path == "/quests":
        if not is_admin(event):
            return err("unauthorized", 401)
        cur.execute(f"""
            UPDATE {SCHEMA}.quests SET title=%s, description=%s, reward=%s, xp=%s, rarity=%s, icon=%s WHERE id=%s
        """, (body.get("title"), body.get("description"), body.get("reward"),
              int(body.get("xp",100)), body.get("rarity"), body.get("icon"), body.get("id")))
        return ok({"success": True})

    # ADMIN: POST /quests/remove
    if method == "POST" and path == "/quests/remove":
        if not is_admin(event):
            return err("unauthorized", 401)
        cur.execute(f"UPDATE {SCHEMA}.quests SET archived=TRUE WHERE id=%s", (body.get("id"),))
        return ok({"success": True})

    # POST /proof — загрузка доказательства выполнения квеста
    if method == "POST" and path == "/proof":
        nick = body.get("nick", "").strip()
        quest_id = body.get("quest_id")
        quest_title = body.get("quest_title", "")
        file_base64 = body.get("file_base64", "")
        file_name = body.get("file_name", "proof.png")
        file_type = body.get("file_type", "image/png")

        if not file_base64:
            return err("file_base64 required")

        import base64
        import boto3
        import uuid

        file_data = base64.b64decode(file_base64)
        ext = file_name.rsplit(".", 1)[-1] if "." in file_name else "bin"
        key = f"quest-proofs/{quest_id}/{uuid.uuid4()}.{ext}"

        s3 = boto3.client(
            "s3",
            endpoint_url="https://bucket.poehali.dev",
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        )
        s3.put_object(Bucket="files", Key=key, Body=file_data, ContentType=file_type)
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{key}"

        # Сохраняем прогресс со статусом pending (ждёт одобрения)
        if nick and quest_id:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.player_progress (player_nick, quest_id, proof_url, status)
                VALUES (%s, %s, %s, 'pending')
                ON CONFLICT (player_nick, quest_id) DO UPDATE SET proof_url = EXCLUDED.proof_url, status = 'pending'
            """, (nick, quest_id, cdn_url))

        # Discord уведомление со ссылкой на файл
        webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "")
        if webhook_url:
            import urllib.request
            is_video = file_type.startswith("video/")
            embed = {
                "title": "📋 Доказательство выполнения",
                "color": 0xF0C040,
                "fields": [
                    {"name": "Игрок", "value": f"**{nick}**", "inline": True},
                    {"name": "Квест", "value": quest_title, "inline": True},
                    {"name": "Файл", "value": f"[Открыть {'видео' if is_video else 'скриншот'}]({cdn_url})", "inline": False},
                ],
                "footer": {"text": "Quest Book Server"},
            }
            if not is_video:
                embed["image"] = {"url": cdn_url}
            payload = json.dumps({"embeds": [embed]}).encode()
            req = urllib.request.Request(webhook_url, data=payload, headers={"Content-Type": "application/json"})
            try:
                urllib.request.urlopen(req, timeout=5)
            except Exception:
                pass

        return ok({"success": True, "url": cdn_url})

    # ADMIN: GET /proofs — список заявок на проверку
    if method == "GET" and path == "/proofs":
        if not is_admin(event):
            return err("unauthorized", 401)
        status_filter = params.get("status", "pending")
        cur.execute(f"""
            SELECT pp.id, pp.player_nick, pp.quest_id, pp.proof_url, pp.status, pp.completed_at,
                   q.title as quest_title, q.xp, q.rarity, q.icon
            FROM {SCHEMA}.player_progress pp
            JOIN {SCHEMA}.quests q ON q.id = pp.quest_id
            WHERE pp.status = %s
            ORDER BY pp.completed_at DESC
        """, (status_filter,))
        rows = cur.fetchall()
        result = [{"id": r[0], "player_nick": r[1], "quest_id": r[2], "proof_url": r[3],
                   "status": r[4], "completed_at": r[5].isoformat() if r[5] else None,
                   "quest_title": r[6], "xp": r[7], "rarity": r[8], "icon": r[9]} for r in rows]
        return ok(result)

    # ADMIN: POST /proofs/approve — одобрить или отклонить заявку
    if method == "POST" and path == "/proofs/approve":
        if not is_admin(event):
            return err("unauthorized", 401)
        proof_id = body.get("id")
        action = body.get("action", "approve")  # approve | reject
        new_status = "approved" if action == "approve" else "rejected"
        cur.execute(f"UPDATE {SCHEMA}.player_progress SET status = %s WHERE id = %s RETURNING player_nick, quest_id", (new_status, proof_id))
        row = cur.fetchone()
        if not row:
            return err("not found", 404)
        return ok({"success": True, "status": new_status, "player_nick": row[0], "quest_id": row[1]})

    return err("not found", 404)