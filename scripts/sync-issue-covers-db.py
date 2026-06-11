"""Sync Muarrix.kiut.uz issue covers into SQLite (no native Node modules required)."""
import os
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "db" / "muarrix.db"
ARCHIVES = ROOT / "public" / "archives"
COVERS = ROOT / "public" / "covers" / "issues"


def parse_meta(name: str):
    tom = num = year = -1
    tm = re.search(r"Том\s*(\d+)", name, re.I)
    nm = re.search(r"№\s*(\d+)", name, re.I)
    ym = re.search(r"\((\d{4})\)", name)
    if not ym:
        ym = re.search(r"\b(20\d{2})\b", name)
    if tm:
        tom = int(tm.group(1))
    if nm:
        num = int(nm.group(1))
    if ym:
        year = int(ym.group(1))
    return tom, num, year


def list_folders():
    folders = [p.name for p in ARCHIVES.iterdir() if p.is_dir()]
    folders.sort(
        key=lambda n: (
            parse_meta(n)[2] if parse_meta(n)[2] > 0 else 0,
            parse_meta(n)[0] if parse_meta(n)[0] > 0 else 0,
            parse_meta(n)[1] if parse_meta(n)[1] > 0 else 0,
            n,
        )
    )
    return folders


def main():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cols = {row[1] for row in cur.execute("PRAGMA table_info(issues)")}
    if "cover_image" not in cols:
        cur.execute("ALTER TABLE issues ADD COLUMN cover_image TEXT")
    if "archive_folder" not in cols:
        cur.execute("ALTER TABLE issues ADD COLUMN archive_folder TEXT")

    folders = list_folders()
    print(f"Found {len(folders)} archive folders")

    for i, folder in enumerate(folders, start=1):
        cover_path = f"/covers/issues/{i}.png"
        cover_file = COVERS / f"{i}.png"
        archive_cover = ARCHIVES / folder / "cover.png"
        if not cover_file.exists() and not archive_cover.exists():
            print(f"  skip #{i} (no cover): {folder}")
            continue

        tom, num, year = parse_meta(folder)
        sort_order = (year if year > 0 else 0) * 10 + (tom if tom > 0 else 0)
        accepting = 1 if tom == 6 and num == 2 else 0
        issued_at = f"{year}-06-01" if year > 0 else None

        row = cur.execute(
            "SELECT id FROM issues WHERE archive_folder = ?", (folder,)
        ).fetchone()
        if not row:
            row = cur.execute("SELECT id FROM issues WHERE title = ?", (folder,)).fetchone()

        if row:
            cur.execute(
                """
                UPDATE issues SET title=?, sort_order=?, accepting_submissions=?,
                issued_at=?, cover_image=?, archive_folder=?
                WHERE id=?
                """,
                (folder, sort_order, accepting, issued_at, cover_path, folder, row[0]),
            )
        else:
            cur.execute(
                """
                INSERT INTO issues
                (journal, title, description, sort_order, accepting_submissions,
                 issued_at, archive_folder, cover_image)
                VALUES ('muarrix', ?, NULL, ?, ?, ?, ?, ?)
                """,
                (folder, sort_order, accepting, issued_at, folder, cover_path),
            )
        print(f"  #{i} -> {folder}")

    cur.execute(
        """
        UPDATE issues SET accepting_submissions = 0
        WHERE journal = 'muarrix' AND (archive_folder IS NULL OR archive_folder NOT LIKE '%Том 6 № 2%')
        """
    )
    cur.execute(
        """
        UPDATE issues SET accepting_submissions = 1
        WHERE journal = 'muarrix' AND archive_folder LIKE '%Том 6 № 2%'
        """
    )

    conn.commit()
    count = cur.execute("SELECT COUNT(*) FROM issues WHERE cover_image IS NOT NULL").fetchone()[0]
    print(f"Done. Issues with covers in DB: {count}")
    conn.close()


if __name__ == "__main__":
    main()
