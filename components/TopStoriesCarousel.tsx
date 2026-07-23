'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PILLAR_LABELS } from '@/lib/pillars'
import { estimateReadingTime } from '@/lib/readingTime'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Post } from '@/lib/content'

interface TopStoriesCarouselProps {
  posts: Post[]
}

export function TopStoriesCarousel({ posts }: TopStoriesCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused || !posts || posts.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === posts.length - 1 ? 0 : prev + 1))
    }, 6000) // Slide every 6 seconds

    return () => clearInterval(interval)
  }, [isPaused, posts])

  if (!posts || posts.length === 0) return null

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? posts.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === posts.length - 1 ? 0 : prev + 1))
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[320px] sm:h-[380px] md:h-[440px] rounded-xl overflow-hidden group"
    >
      {posts.map((post, idx) => {
        const isActive = idx === activeIndex
        const readingMinutes = estimateReadingTime(post.content)
        const publishedDate = new Date(post.frontmatter.publishedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })

        return (
          <div
            key={post.slug}
            className={`absolute inset-0 w-full h-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isActive
                ? 'opacity-100 scale-100 pointer-events-auto z-10'
                : 'opacity-0 scale-[1.02] pointer-events-none z-0'
            }`}
          >
            {post.frontmatter.ogImage && (
              <img
                src={post.frontmatter.ogImage}
                alt={post.frontmatter.title}
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.01]"
              />
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 md:p-8 w-full flex flex-col gap-2 z-20">
              <div>
                <Badge
                  className="border-none bg-[var(--color-accent)] hover:bg-[var(--color-accent)] text-white text-[9px] font-semibold uppercase tracking-widest rounded-[3px] px-1.5 py-0.5 h-auto leading-[1.6]"
                >
                  {PILLAR_LABELS[post.pillar] ?? post.pillar}
                </Badge>
              </div>

              <Link href={`/${post.pillar}/${post.slug}`} className="block max-w-4xl">
                <h2 className="font-article font-bold text-white text-[1.6rem] sm:text-[2rem] md:text-[2.6rem] leading-[1.1] tracking-[-0.01em] hover:text-neutral-200 transition-colors line-clamp-2">
                  {post.frontmatter.title}
                </h2>
              </Link>

              <p className="text-[12.5px] sm:text-[13px] text-white/80 max-w-2xl leading-[1.6] line-clamp-1 sm:line-clamp-2">
                {post.frontmatter.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-[11px] text-white/60">
                  {post.frontmatter.author && (
                    <>
                      <span className="font-medium text-white/80">
                        {post.frontmatter.author}
                      </span>
                      <span className="text-white/40">·</span>
                    </>
                  )}
                  <time dateTime={post.frontmatter.publishedAt} className="tabular-nums">
                    {publishedDate}
                  </time>
                  <span className="text-white/40">·</span>
                  <span>{readingMinutes} min read</span>
                </div>

                <Link
                  href={`/${post.pillar}/${post.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-white/20 hover:bg-white/30 backdrop-blur transition-all active:scale-[0.97]"
                >
                  Read Article →
                </Link>
              </div>
            </div>
          </div>
        )
      })}

      {/* Navigation Arrows */}
      {posts.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 size-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white flex items-center justify-center backdrop-blur transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none hover:scale-105 active:scale-95 duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 size-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white flex items-center justify-center backdrop-blur transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none hover:scale-105 active:scale-95 duration-300"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {posts.length > 1 && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-black/35 backdrop-blur px-2.5 py-1 rounded-full border border-white/5">
          {posts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`size-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
