import Link from "next/link";
import { listMemes, listMemesByTag } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const activeTag = tag?.trim().toLowerCase() || null;
  const memes = activeTag ? listMemesByTag(activeTag) : listMemes();

  // Every tag in use, for the filter bar.
  const allTags = [...new Set(listMemes().flatMap((m) => m.tags))].sort();

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

      {allTags.length > 0 && (
        <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-2">
          <Link
            href="/gallery"
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeTag === null
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            All
          </Link>
          {allTags.map((t) => (
            <Link
              key={t}
              href={`/gallery?tag=${encodeURIComponent(t)}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTag === t
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              #{t}
            </Link>
          ))}
        </nav>
      )}

      <section className="mx-auto w-full max-w-5xl">
        {memes.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {activeTag
              ? `No memes tagged #${activeTag} yet.`
              : "No memes saved yet. Generate one and hit Save."}
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
                <div className="flex flex-col gap-1 px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>
                      #{meme.id} · {meme.template_name}
                    </span>
                    <time>{new Date(meme.created_at).toLocaleString()}</time>
                  </div>
                  {meme.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {meme.tags.map((t) => (
                        <Link
                          key={t}
                          href={`/gallery?tag=${encodeURIComponent(t)}`}
                          className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          #{t}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
