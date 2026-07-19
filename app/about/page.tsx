import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPageBySlug } from '@/lib/pages'

export function generateMetadata(): Metadata {
  const page = getPageBySlug('about')
  if (!page) return {}
  return { title: page.title }
}

export default function AboutPage() {
  const page = getPageBySlug('about')
  if (!page) notFound()
  return (
    <main className="mx-auto max-w-[720px] px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-6">{page.title}</h1>
      <div className="prose dark:prose-invert max-w-none">
        <MDXRemote source={page.content} />
      </div>
    </main>
  )
}
