import Link from 'next/link'
import { getAllPosts } from '@/lib/content'

export default function HomePage() {
  const posts = getAllPosts()
  return (
    <main>
      <h1>Mavora</h1>
      <ul>
        {posts.map((post) => (
          <li key={`${post.pillar}-${post.slug}`}>
            <Link href={`/${post.pillar}/${post.slug}`}>{post.frontmatter.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
