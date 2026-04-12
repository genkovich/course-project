import path from "node:path";
import Database from "better-sqlite3";
import { SEED_CAPTIONS, SEED_TEMPLATES } from "./seed";

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
  created_at: string;
};

export type MemeWithTemplate = Meme & {
  template_name: string;
  template_image_path: string;
};

const DB_PATH = path.join(process.cwd(), "data.db");

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
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );
  `);
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
}): { id: number } {
  const result = getDb()
    .prepare(
      "INSERT INTO memes (template_id, top_text, bottom_text) VALUES (?, ?, ?)"
    )
    .run(input.templateId, input.topText, input.bottomText);
  return { id: Number(result.lastInsertRowid) };
}

export function listMemes(): MemeWithTemplate[] {
  return getDb()
    .prepare(
      `SELECT m.id,
              m.template_id,
              m.top_text,
              m.bottom_text,
              m.created_at,
              t.name       AS template_name,
              t.image_path AS template_image_path
       FROM memes m
       JOIN templates t ON t.id = m.template_id
       ORDER BY m.created_at DESC, m.id DESC`
    )
    .all() as MemeWithTemplate[];
}
