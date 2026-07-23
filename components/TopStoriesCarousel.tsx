'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PILLAR_LABELS } from '@/lib/pillars'
import { estimateReadingTime } from '@/lib/readingTime'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Post } from '@/lib/content'

interface TopStoriesCarouselProps {
  posts: Post[]
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0.9,
  }),
  center: {
    x: 0,
    opacity: 1,
    zIndex: 10,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0.9,
    zIndex: 0,
  }),
}

export function TopStoriesCarousel({ posts }: TopStoriesCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 for right, -1 for left
  const [isPaused, setIsPaused] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 40

  useEffect(() => {
    if (isPaused || !posts || posts.length <= 1) return

    const interval = setInterval(() => {
      setDirection(1)
      setActiveIndex((prev) => (prev === posts.length - 1 ? 0 : prev + 1))
    }, 6000) // Slide every 6 seconds

    return () => clearInterval(interval)
  }, [isPaused, posts])

  if (!posts || posts.length === 0) return null

  const handlePrev = () => {
    setDirection(-1)
    setActiveIndex((prev) => (prev === 0 ? posts.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setDirection(1)
    setActiveIndex((prev) => (prev === posts.length - 1 ? 0 : prev + 1))
  }

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsPaused(true) // Pause autoplay on touch interaction
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    setIsPaused(false) // Resume autoplay on touch release
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe) {
      handlePrev()
    }
  }

  const post = posts[activeIndex]
  const readingMinutes = estimateReadingTime(post.content)
  const publishedDate = new Date(post.frontmatter.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative w-full h-[320px] sm:h-[380px] md:h-[440px] rounded-xl overflow-hidden group bg-neutral-900 select-none touch-pan-y"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes carousel-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-carousel-progress {
          animation: carousel-progress 6000ms linear forwards;
        }
      `}} />

      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={post.slug}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.3 },
            opacity: { duration: 0.15 }
          }}
          className="absolute inset-0 w-full h-full"
        >
          {post.frontmatter.ogImage && (
            <img
              src={post.frontmatter.ogImage}
              alt={post.frontmatter.title}
              className="absolute inset-0 w-full h-full object-cover object-top"
              draggable="false"
            />
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent z-10" />

          {/* Content Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 md:p-8 w-full flex flex-col gap-2 z-20">
            <div>
              <Badge
                className="border-none bg-[var(--color-accent)] hover:bg-[var(--color-accent)] text-white text-[9px] font-semibold uppercase tracking-widest rounded-[3px] px-1.5 py-0.5 h-auto leading-[1.6]"
              >
                {PILLAR_LABELS[post.pillar] ?? post.pillar}
              </Badge>
            </div>

            <Link href={`/${post.pillar}/${post.slug}`} className="block max-w-4xl" draggable="false">
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
                draggable="false"
              >
                Read Article →
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {posts.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 size-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white flex items-center justify-center backdrop-blur transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 outline-none hover:scale-105 active:scale-95 duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 size-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white flex items-center justify-center backdrop-blur transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 outline-none hover:scale-105 active:scale-95 duration-300"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* Autoplay progress bar timer (acts as visual indicator) */}
      {posts.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/10 z-30 pointer-events-none">
          <div
            key={activeIndex}
            className="h-full bg-[var(--color-accent)] animate-carousel-progress"
          />
        </div>
      )}

      {/* Slide Indicators */}
      {posts.length > 1 && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-black/35 backdrop-blur px-2.5 py-1 rounded-full border border-white/5">
          {posts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > activeIndex ? 1 : -1)
                setActiveIndex(idx)
              }}
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
