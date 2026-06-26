# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-15

### Added

- Meme generator: pick a random template and two captions, render on a canvas, save it
- Gallery page listing every saved meme
- HTTP API: `GET/POST /api/memes`, `GET /api/memes/random`
- SQLite persistence via `lib/db.ts` (templates, captions, memes)
