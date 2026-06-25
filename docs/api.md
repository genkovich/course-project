# API reference

The public surface of the meme generator, for someone who depends on it.

> This file is **hand-written** and lives next to the code. It is the exact
> surface `check-docs-drift` checks: when `lib/db.ts` grows a public data
> function that this page does not list, that gap is **doc drift** — the doc
> fell behind the code. Keep it in sync, or let the drift tool catch it.

## Data functions (`lib/db.ts`)

| Function | What it does |
|---|---|
| `getRandomTemplate()` | Return a random meme template; throws if none exist. |
| `getRandomCaption()` | Return a random caption; throws if none exist. |
| `saveMeme(input)` | Save a meme (`templateId`, `topText`, `bottomText`) and return its id. |
| `listMemes()` | Return all saved memes (newest first) joined with their template. |

## HTTP API

| Route | Method | What it does |
|---|---|---|
| `/api/memes` | GET | Return all saved memes. |
| `/api/memes` | POST | Save a meme from `{ templateId, topText, bottomText }`. |
| `/api/memes/random` | GET | Return a random template plus two random captions. |
