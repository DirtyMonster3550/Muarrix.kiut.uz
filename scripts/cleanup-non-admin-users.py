#!/usr/bin/env python3
"""Remove all users except admins and their related submissions/notifications."""
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / "db" / "stem.db"


def main():
    conn = sqlite3.connect(DB)
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()

    cur.execute("SELECT id, email, role FROM users WHERE role = 'admin'")
    admins = cur.fetchall()
    if not admins:
        raise SystemExit("No admin account found — aborting.")

    admin_ids = [a[0] for a in admins]
    ph = ",".join("?" * len(admin_ids))

    print("Keeping admins:")
    for row in admins:
        print(f"  id={row[0]} email={row[1]} role={row[2]}")

    cur.execute(
        f"""
        DELETE FROM notifications
        WHERE user_id NOT IN ({ph})
           OR submission_id IN (
             SELECT id FROM submissions WHERE user_id NOT IN ({ph})
           )
        """,
        admin_ids + admin_ids,
    )
    print(f"Deleted notifications: {cur.rowcount}")

    cur.execute(f"DELETE FROM submissions WHERE user_id NOT IN ({ph})", admin_ids)
    print(f"Deleted submissions: {cur.rowcount}")

    cur.execute(
        f"DELETE FROM security_events WHERE user_id IS NOT NULL AND user_id NOT IN ({ph})",
        admin_ids,
    )
    print(f"Deleted security_events (user-linked): {cur.rowcount}")

    cur.execute(f"DELETE FROM users WHERE id NOT IN ({ph})", admin_ids)
    print(f"Deleted users: {cur.rowcount}")

    conn.commit()

    cur.execute("SELECT id, email, role FROM users")
    print("Remaining users:", cur.fetchall())
    cur.execute("SELECT COUNT(*) FROM submissions")
    print("Remaining submissions:", cur.fetchone()[0])
    cur.execute("SELECT COUNT(*) FROM notifications")
    print("Remaining notifications:", cur.fetchone()[0])

    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
