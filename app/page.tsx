import { getAllPosts } from '@/lib/content'
import { ArticleCard } from '@/components/ArticleCard'
import { CategoryList } from '@/components/CategoryList'

export default function HomePage() {
  const posts = getAllPosts()
  const [hero, ...rest] = posts
  const latestNews = rest.slice(0, 4)
  const featured = rest.slice(4, 7)
  const latestArticles = rest.slice(7)

  return (
    <main className="mx-auto max-w-[1280px] px-6 md:px-8 py-10">
      {hero && (
        <section className="grid md:grid-cols-3 gap-10 mb-16">
          <div className="md:col-span-2">
            <ArticleCard post={hero} variant="hero" />
          </div>
          <aside className="flex flex-col gap-8">
            {latestNews.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-fg-muted)] mb-3">
                  Latest News
                </h3>
                <div className="flex flex-col gap-4">
                  {latestNews.map((post) => (
                    <ArticleCard key={`${post.pillar}-${post.slug}`} post={post} variant="compact" />
                  ))}
                </div>
              </div>
            )}
            <CategoryList />
          </aside>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mb-16">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-fg-muted)] mb-6">Featured</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {featured.map((post) => (
              <ArticleCard key={`${post.pillar}-${post.slug}`} post={post} variant="grid" />
            ))}
          </div>
        </section>
      )}

      {latestArticles.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-fg-muted)] mb-6">
            Latest Articles
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {latestArticles.map((post) => (
              <ArticleCard key={`${post.pillar}-${post.slug}`} post={post} variant="grid" />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
