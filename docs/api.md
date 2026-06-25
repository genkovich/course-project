# API reference

The developer-facing surface of the meme generator, for someone who depends on
it. This is the **dev** reference (functions, routes); the **user** guide lives
in [`user-guide/`](user-guide/index.md).

> Hand-written, kept next to the code. Update it when `lib/db.ts` grows or
> changes a public data function.

## Data functions (`lib/db.ts`)

| Function | What it does |
|---|---|
| `getRandomTemplate()` | Return a random meme template; throws if none exist. |
| `getRandomCaption()` | Return a random caption; throws if none exist. |
| `saveMeme(input)` | Save a meme (`templateId`, `topText`, `bottomText`, optional `tags`) and return its id. |
| `listMemes()` | Return all saved memes (newest first) joined with their template. |
| `listMemesByTag(tag)` | Return saved memes carrying `tag` (case-insensitive); `[]` if none match. |

## HTTP API

| Route | Method | What it does |
|---|---|---|
| `/api/memes` | GET | Return all saved memes, or only those matching `?tag=<tag>`. |
| `/api/memes` | POST | Save a meme from `{ templateId, topText, bottomText, tags? }`. |
| `/api/memes/random` | GET | Return a random template plus two random captions. |
