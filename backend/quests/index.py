"""
API для управления квестами: ветки, квесты, прогресс игроков, CRUD для админа.
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p88778265_quest_book_server")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Max-Age": "86400",
}

def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def get_header(event, name):
    headers = event.get("headers") or {}
    for k, v in headers.items():
        if k.lower() == name.lower():
            return v
    return ""

def is_admin(event):
    key = get_header(event, "X-Admin-Key")
    return key == os.environ.get("ADMIN_KEY", "")

def handler(event: dict, context) -> dict:
    """API квестовой книги — ветки, квесты, прогресс, админка."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    path = params.get("route", event.get("path", "/"))
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            body = {}

    try:
        conn = get_conn()
        cur = conn.cursor()
    except Exception as e:
        return err(f"DB connection failed: {e}", 500)

    # GET / — все ветки с квестами
    if method == "GET" and path in ("/", ""):
        cur.execute(f"""
            SELECT b.id, b.title, b.icon, b.color, b.description, b.sort_order,
                   json_agg(
                       json_build_object(
                           'id', q.id, 'title', q.title, 'description', q.description,
                           'reward', q.reward, 'xp', q.xp, 'rarity', q.rarity,
                           'icon', q.icon, 'sort_order', q.sort_order,
                           'unlocked', q.unlocked
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
        cur.execute(f"SELECT quest_id FROM {SCHEMA}.player_progress WHERE player_nick = %s AND status = 'approved'", (nick,))
        ids = [row[0] for row in cur.fetchall()]
        return ok({"nick": nick, "completed_quest_ids": ids})

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
            INSERT INTO {SCHEMA}.quests (branch_id, title, description, reward, xp, rarity, icon, sort_order, unlocked)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (branch_id, body.get("title","Новый квест"), body.get("description",""),
              body.get("reward",""), int(body.get("xp",100)), body.get("rarity","common"),
              body.get("icon","Star"), next_order, bool(body.get("unlocked", False))))
        return ok({"id": cur.fetchone()[0]})

    # ADMIN: PUT /quests
    if method == "PUT" and path == "/quests":
        if not is_admin(event):
            return err("unauthorized", 401)
        cur.execute(f"""
            UPDATE {SCHEMA}.quests SET title=%s, description=%s, reward=%s, xp=%s, rarity=%s, icon=%s, unlocked=%s WHERE id=%s
        """, (body.get("title"), body.get("description"), body.get("reward"),
              int(body.get("xp",100)), body.get("rarity"), body.get("icon"), bool(body.get("unlocked", False)), body.get("id")))
        return ok({"success": True})

    # ADMIN: POST /quests/reorder
    if method == "POST" and path == "/quests/reorder":
        if not is_admin(event):
            return err("unauthorized", 401)
        ids = body.get("ids", [])
        if not ids:
            return err("ids required")
        for i, qid in enumerate(ids):
            cur.execute(f"UPDATE {SCHEMA}.quests SET sort_order=%s WHERE id=%s", (i, qid))
        return ok({"success": True})

    # ADMIN: POST /branches/reorder
    if method == "POST" and path == "/branches/reorder":
        if not is_admin(event):
            return err("unauthorized", 401)
        ids = body.get("ids", [])
        if not ids:
            return err("ids required")
        for i, bid in enumerate(ids):
            cur.execute(f"UPDATE {SCHEMA}.branches SET sort_order=%s WHERE id=%s", (i, bid))
        return ok({"success": True})

    # ADMIN: POST /quests/remove
    if method == "POST" and path == "/quests/remove":
        if not is_admin(event):
            return err("unauthorized", 401)
        cur.execute(f"UPDATE {SCHEMA}.quests SET archived=TRUE WHERE id=%s", (body.get("id"),))
        return ok({"success": True})

    # ADMIN: GET /players — список всех игроков с прогрессом
    if method == "GET" and path == "/players":
        if not is_admin(event):
            return err("unauthorized", 401)
        cur.execute(f"""
            SELECT pp.player_nick,
                   COUNT(*) FILTER (WHERE pp.status = 'approved') as completed,
                   COALESCE(SUM(q.xp) FILTER (WHERE pp.status = 'approved'), 0) as total_xp,
                   MAX(pp.completed_at) as last_active
            FROM {SCHEMA}.player_progress pp
            JOIN {SCHEMA}.quests q ON q.id = pp.quest_id
            GROUP BY pp.player_nick
            ORDER BY total_xp DESC
        """)
        rows = cur.fetchall()
        result = [{"nick": r[0], "completed": r[1], "total_xp": int(r[2]), "last_active": r[3]} for r in rows]
        return ok(result)

    # ADMIN: GET /player-progress?nick=Steve — прогресс конкретного игрока
    if method == "GET" and path == "/player-progress":
        if not is_admin(event):
            return err("unauthorized", 401)
        nick = params.get("nick", "").strip()
        if not nick:
            return err("nick required")
        cur.execute(f"""
            SELECT pp.id, pp.quest_id, pp.status, pp.completed_at, q.title, q.xp, q.rarity, q.icon, b.title as branch_title
            FROM {SCHEMA}.player_progress pp
            JOIN {SCHEMA}.quests q ON q.id = pp.quest_id
            JOIN {SCHEMA}.branches b ON b.id = q.branch_id
            WHERE pp.player_nick = %s
            ORDER BY pp.completed_at DESC
        """, (nick,))
        rows = cur.fetchall()
        result = [{"id": r[0], "quest_id": r[1], "status": r[2], "completed_at": r[3],
                   "quest_title": r[4], "xp": r[5], "rarity": r[6], "icon": r[7], "branch_title": r[8]} for r in rows]
        return ok(result)

    # ADMIN: POST /progress — выдать или отозвать квест игроку
    if method == "POST" and path == "/progress":
        if not is_admin(event):
            return err("unauthorized", 401)
        nick = body.get("nick", "").strip()
        quest_id = body.get("quest_id")
        action = body.get("action", "grant")
        if not nick or not quest_id:
            return err("nick and quest_id required")
        cur.execute(f"SELECT id FROM {SCHEMA}.quests WHERE id = %s AND archived = FALSE", (quest_id,))
        if not cur.fetchone():
            return err("quest not found", 404)
        if action == "grant":
            cur.execute(f"""
                INSERT INTO {SCHEMA}.player_progress (player_nick, quest_id, status)
                VALUES (%s, %s, 'approved')
                ON CONFLICT (player_nick, quest_id) DO UPDATE SET status = 'approved'
            """, (nick, quest_id))
            return ok({"success": True, "action": "granted"})
        elif action == "revoke":
            cur.execute(f"DELETE FROM {SCHEMA}.player_progress WHERE player_nick = %s AND quest_id = %s", (nick, quest_id))
            return ok({"success": True, "action": "revoked"})
        return err("action must be grant or revoke")

    return err("not found", 404)