import path from "node:path";
import Database from "better-sqlite3";
import { SEED_CAPTIONS, SEED_MEMES, SEED_TEMPLATES } from "./seed";

export type Template = {
  id: number;
  name: string;
  image_path: string;
};

export type Caption = {
  id: number;
  text: string;
};

export type Meme = {
  id: number;
  template_id: number;
  top_text: string | null;
  bottom_text: string | null;
  tags: string[];
  created_at: string;
};

export type MemeWithTemplate = Meme & {
  template_name: string;
  template_image_path: string;
};

const DB_PATH =
  process.env.DB_PATH ?? path.join(process.cwd(), "data.db");

let dbInstance: Database.Database | null = null;

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initDb(db);
  seedIfEmpty(db);
  return db;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = createDb();
  }
  return dbInstance;
}

function initDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      image_path TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS captions (
      id   INTEGER PRIMARY KEY,
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memes (
      id          INTEGER PRIMARY KEY,
      template_id INTEGER NOT NULL,
      top_text    TEXT,
      bottom_text TEXT,
      tags        TEXT NOT NULL DEFAULT '',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );
  `);

  // Migration: older databases predate the tags column. Add it once.
  const columns = db.prepare("PRAGMA table_info(memes)").all() as {
    name: string;
  }[];
  if (!columns.some((c) => c.name === "tags")) {
    db.exec("ALTER TABLE memes ADD COLUMN tags TEXT NOT NULL DEFAULT ''");
  }
}

function seedIfEmpty(db: Database.Database): void {
  const templateCount = db
    .prepare("SELECT COUNT(*) AS c FROM templates")
    .get() as { c: number };

  if (templateCount.c === 0) {
    const insertTemplate = db.prepare(
      "INSERT INTO templates (name, image_path) VALUES (?, ?)"
    );
    const insertMany = db.transaction((rows: typeof SEED_TEMPLATES) => {
      for (const row of rows) insertTemplate.run(row.name, row.imagePath);
    });
    insertMany(SEED_TEMPLATES);
  }

  const captionCount = db
    .prepare("SELECT COUNT(*) AS c FROM captions")
    .get() as { c: number };

  if (captionCount.c === 0) {
    const insertCaption = db.prepare("INSERT INTO captions (text) VALUES (?)");
    const insertMany = db.transaction((rows: ReadonlyArray<string>) => {
      for (const row of rows) insertCaption.run(row);
    });
    insertMany(SEED_CAPTIONS);
  }

  const memeCount = db
    .prepare("SELECT COUNT(*) AS c FROM memes")
    .get() as { c: number };

  if (memeCount.c === 0) {
    // Resolve each seed meme's template by name — ids are assigned at insert.
    const templateId = new Map<string, number>();
    for (const t of db.prepare("SELECT id, name FROM templates").all() as {
      id: number;
      name: string;
    }[]) {
      templateId.set(t.name, t.id);
    }
    const insertMeme = db.prepare(
      "INSERT INTO memes (template_id, top_text, bottom_text, tags) VALUES (?, ?, ?, ?)"
    );
    const insertMany = db.transaction((rows: typeof SEED_MEMES) => {
      for (const row of rows) {
        const id = templateId.get(row.templateName);
        if (!id) continue;
        insertMeme.run(
          id,
          row.topText,
          row.bottomText,
          normalizeTags(row.tags).join(",")
        );
      }
    });
    insertMany(SEED_MEMES);
  }
}

// A tag is lowercase, trimmed, and unique. Empty tags are dropped.
function normalizeTags(tags: ReadonlyArray<string> | undefined): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const tag = raw.trim().toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen];
}

type MemeRow = {
  id: number;
  template_id: number;
  top_text: string | null;
  bottom_text: string | null;
  tags: string;
  created_at: string;
  template_name: string;
  template_image_path: string;
};

function rowToMeme(row: MemeRow): MemeWithTemplate {
  return {
    id: row.id,
    template_id: row.template_id,
    top_text: row.top_text,
    bottom_text: row.bottom_text,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    created_at: row.created_at,
    template_name: row.template_name,
    template_image_path: row.template_image_path,
  };
}

export function getRandomTemplate(): Template {
  const row = getDb()
    .prepare("SELECT * FROM templates ORDER BY RANDOM() LIMIT 1")
    .get() as Template | undefined;
  if (!row) throw new Error("No templates available");
  return row;
}

export function getRandomCaption(): Caption {
  const row = getDb()
    .prepare("SELECT * FROM captions ORDER BY RANDOM() LIMIT 1")
    .get() as Caption | undefined;
  if (!row) throw new Error("No captions available");
  return row;
}

export function saveMeme(input: {
  templateId: number;
  topText: string | null;
  bottomText: string | null;
  tags?: ReadonlyArray<string>;
}): { id: number } {
  const tags = normalizeTags(input.tags);
  const result = getDb()
    .prepare(
      "INSERT INTO memes (template_id, top_text, bottom_text, tags) VALUES (?, ?, ?, ?)"
    )
    .run(input.templateId, input.topText, input.bottomText, tags.join(","));
  return { id: Number(result.lastInsertRowid) };
}

const LIST_QUERY = `SELECT m.id,
        m.template_id,
        m.top_text,
        m.bottom_text,
        m.tags,
        m.created_at,
        t.name       AS template_name,
        t.image_path AS template_image_path
 FROM memes m
 JOIN templates t ON t.id = m.template_id
 ORDER BY m.created_at DESC, m.id DESC`;

export function listMemes(): MemeWithTemplate[] {
  const rows = getDb().prepare(LIST_QUERY).all() as MemeRow[];
  return rows.map(rowToMeme);
}

// A filter, not a single-row lookup: an empty result is a valid answer (no meme
// carries this tag), so it returns [] rather than throwing. The house rule about
// raising a named error applies to lookups like getRandomTemplate that must find
// exactly one row.
export function listMemesByTag(tag: string): MemeWithTemplate[] {
  const needle = tag.trim().toLowerCase();
  if (!needle) return listMemes();
  return listMemes().filter((meme) => meme.tags.includes(needle));
}
