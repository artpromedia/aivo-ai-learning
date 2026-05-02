import os, psycopg2

conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()

cur.execute("SELECT id, email, name FROM users WHERE email = 'oeofem23@smumn.edu'")
user = cur.fetchone()
if user:
    print("User: id=%s, email=%s, name=%s" % (user[0], user[1], user[2]))
    cur.execute("SELECT id, token_hash, expires_at, used_at, created_at FROM password_reset_tokens WHERE user_id = %s ORDER BY created_at DESC", (user[0],))
    tokens = cur.fetchall()
    print("Tokens for user: %d" % len(tokens))
    for t in tokens:
        print("  hash=%s expires=%s used=%s created=%s" % (t[1], t[2], t[3], t[4]))
else:
    print("User NOT FOUND")

cur.execute("SELECT COUNT(*) FROM password_reset_tokens")
print("Total tokens: %d" % cur.fetchone()[0])

cur.close()
conn.close()
