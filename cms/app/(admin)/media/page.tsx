import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Folder, Image as ImageIcon } from '@carbon/icons-react'
import { MagicCard } from '@/components/ui/magic-card'
import { Progress } from '@/components/ui/progress'
import { BorderBeam } from '@/components/ui/border-beam'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/role'
import { getDb, getMediaBucket } from '@/lib/cloudflare'
import { getR2UsedBytes, R2_FREE_TIER_BYTES } from '@/lib/stats'
import { listMedia, type MediaRecord } from '@/lib/media'

function formatBytes(bytes: number): { value: number; unit: string } {
  if (bytes >= 1024 ** 3) return { value: bytes / 1024 ** 3, unit: 'GB' }
  if (bytes >= 1024 ** 2) return { value: bytes / 1024 ** 2, unit: 'MB' }
  if (bytes >= 1024) return { value: bytes / 1024, unit: 'KB' }
  return { value: bytes, unit: 'B' }
}

function pct(num: number, denom: number): number {
  if (denom <= 0) return 0
  return Math.min(100, Math.max(0, (num / denom) * 100))
}

function filenameFromKey(r2Key: string): string {
  // r2_key looks like `articles/<articleId>/<uuid>.<ext>`. The last segment
  // is the upload's filename-on-bucket; the article id is noise for the
  // gallery UI, so just show the basename.
  return r2Key.split('/').pop() ?? r2Key
}

export default async function MediaPage() {
  const guard = await requireRole(['admin', 'writer'])
  if (guard instanceof Response) redirect('/login')

  const db = getDb()
  const [items, r2UsedBytes] = await Promise.all([
    listMedia(db, {
      isAdmin: guard.writer.role === 'admin',
      authorId: guard.writer.id,
    }),
    getR2UsedBytes(getMediaBucket()),
  ])

  const storage = formatBytes(r2UsedBytes)
  const storagePct = pct(r2UsedBytes, R2_FREE_TIER_BYTES)

  const publicBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Media
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Every image attached to {guard.writer.role === 'admin' ? 'any article' : 'your articles'}.
        </p>
      </div>

      {/* Storage bar */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
        <BorderBeam size={120} duration={8} colorFrom="var(--color-accent)" colorTo="var(--color-accent-hover)" />
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-[var(--color-fg-subtle)]">R2 Storage</span>
          <Folder className="size-5 text-[var(--color-fg-muted)]" />
        </div>
        <div className="mt-3 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {storage.value.toFixed(storage.value < 10 ? 2 : 1)} {storage.unit}
        </div>
        <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
          of {formatBytes(R2_FREE_TIER_BYTES).value.toFixed(0)} GB free tier · {storagePct.toFixed(1)}% used
        </p>
        <Progress value={storagePct} className="mt-4" />
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <MagicCard
          className="rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)] p-12 text-center"
          gradientSize={220}
          gradientFrom="var(--color-accent)"
          gradientTo="var(--color-accent-hover)"
          gradientOpacity={0.12}
        >
          <div className="mx-auto size-14 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)] mb-4">
            <ImageIcon className="size-7" />
          </div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            No media uploaded yet
          </h2>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)] max-w-md mx-auto">
            Cover images and inline media are uploaded from the article editor. Open an article, then add a cover image or paste one into the BlockNote editor.
          </p>
          <Button
            render={<Link href="/articles/new" className="inline-flex items-center" />}
            className="mt-6"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            Start writing
          </Button>
        </MagicCard>
      )}

      {/* Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <MediaTile key={item.id} item={item} publicBase={publicBase} />
          ))}
        </div>
      )}
    </div>
  )
}

function MediaTile({ item, publicBase }: { item: MediaRecord; publicBase: string }) {
  const url = publicBase ? `${publicBase.replace(/\/+$/, '')}/${item.r2Key}` : ''
  const filename = filenameFromKey(item.r2Key)

  return (
    <MagicCard
      className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden"
      gradientSize={140}
      gradientFrom="var(--color-accent)"
      gradientTo="var(--color-accent-hover)"
      gradientOpacity={0.18}
    >
      <div className="aspect-video w-full bg-[var(--color-bg-tertiary)] flex items-center justify-center overflow-hidden">
        {url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={url}
            alt={item.altText || filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="size-10 text-[var(--color-fg-subtle)]" />
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate" title={filename}>
          {filename}
        </p>
        <p className="text-xs text-[var(--color-fg-subtle)] truncate" title={item.altText}>
          {item.altText || <span className="italic">no alt text</span>}
        </p>
        {item.articleTitle && (
          <Link
            href={`/articles/${item.articleId}`}
            className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] truncate block"
          >
            ↳ {item.articleTitle}
          </Link>
        )}
      </div>
    </MagicCard>
  )
}