import Link from "next/link";
import { listMemes } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function GalleryPage() {
  const memes = listMemes();

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Gallery
        </h1>
        <Link
          href="/"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          ← Back to generator
        </Link>
      </header>

      <section className="mx-auto w-full max-w-5xl">
        {memes.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            No memes saved yet. Generate one and hit Save.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memes.map((meme) => (
              <li
                key={meme.id}
                className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={meme.template_image_path}
                    alt={meme.template_name}
                    className="h-full w-full object-cover"
                  />
                  {meme.top_text && (
                    <p className="absolute left-0 right-0 top-2 px-2 text-center text-lg font-black uppercase leading-tight text-white [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]">
                      {meme.top_text}
                    </p>
                  )}
                  {meme.bottom_text && (
                    <p className="absolute bottom-2 left-0 right-0 px-2 text-center text-lg font-black uppercase leading-tight text-white [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]">
                      {meme.bottom_text}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>#{meme.id} · {meme.template_name}</span>
                  <time>{new Date(meme.created_at).toLocaleString()}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
