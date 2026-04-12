"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type RandomMeme = {
  template: { id: number; name: string; imagePath: string };
  topText: string;
  bottomText: string;
};

const CANVAS_SIZE = 600;

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  maxWidth: number,
  baselineY: number,
  lineHeight: number,
  align: "top" | "bottom"
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  const orderedLines = align === "top" ? lines : [...lines].reverse();
  orderedLines.forEach((line, idx) => {
    const y =
      align === "top"
        ? baselineY + idx * lineHeight
        : baselineY - idx * lineHeight;
    ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
  });
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [meme, setMeme] = useState<RandomMeme | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const renderMeme = useCallback((current: RandomMeme) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx.font = "bold 44px Impact, 'Arial Black', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 6;
      ctx.lineJoin = "round";

      const maxWidth = CANVAS_SIZE - 40;
      const lineHeight = 50;

      ctx.textBaseline = "top";
      drawWrappedText(
        ctx,
        current.topText.toUpperCase(),
        CANVAS_SIZE / 2,
        maxWidth,
        20,
        lineHeight,
        "top"
      );

      ctx.textBaseline = "bottom";
      drawWrappedText(
        ctx,
        current.bottomText.toUpperCase(),
        CANVAS_SIZE / 2,
        maxWidth,
        CANVAS_SIZE - 20,
        lineHeight,
        "bottom"
      );
    };
    img.onerror = () => {
      setError(`Failed to load template image: ${current.template.imagePath}`);
    };
    img.src = current.template.imagePath;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || meme) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = "#6b7280";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Click Generate to create a meme", CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  }, [meme]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch("/api/memes/random", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RandomMeme;
      setMeme(data);
      renderMeme(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }, [renderMeme]);

  const handleSave = useCallback(async () => {
    if (!meme) return;
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: meme.template.id,
          topText: meme.topText,
          bottomText: meme.bottomText,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { id: number };
      setStatus(`Saved as meme #${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [meme]);

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <header className="flex w-full max-w-3xl items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Meme Generator
        </h1>
        <Link
          href="/gallery"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Gallery →
        </Link>
      </header>

      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full max-w-[600px] rounded-lg border border-zinc-300 bg-white shadow dark:border-zinc-700"
      />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!meme || saving}
          className="rounded-full border border-zinc-900 px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:opacity-50 dark:border-zinc-50 dark:text-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-900"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {meme && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Template: <span className="font-medium">{meme.template.name}</span>
        </p>
      )}
      {status && (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {status}
        </p>
      )}
      {error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </main>
  );
}
