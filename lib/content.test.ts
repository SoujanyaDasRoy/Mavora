import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getAllPosts, getPostsByPillar, getPostBySlug } from './content'

describe('content loader', () => {
  it('loads all non-draft posts sorted newest first', () => {
    const posts = getAllPosts()
    expect(posts.length).toBeGreaterThan(0)
    expect(posts[0].frontmatter.title).toBeDefined()
  })

  it('filters posts by pillar', () => {
    const posts = getPostsByPillar('ai')
    expect(posts.every((p) => p.pillar === 'ai')).toBe(true)
  })

  it('loads a single post by slug', () => {
    const post = getPostBySlug('ai', 'example-post')
    expect(post).not.toBeNull()
    expect(post?.frontmatter.title).toBe('Example AI Post')
  })

  it('returns null for a missing slug', () => {
    const post = getPostBySlug('ai', 'does-not-exist')
    expect(post).toBeNull()
  })
})

describe('content loader pillar consistency', () => {
  // This fixture is filed under `technology/` but its frontmatter claims
  // `pillar: "ai"`. It is written just before, and removed right after,
  // this test so the other tests above (which call getAllPosts() /
  // getPostsByPillar() and scan every pillar directory) are unaffected.
  const mismatchedPath = path.join(
    process.cwd(),
    'content',
    'posts',
    'technology',
    'mismatched-pillar.mdx'
  )
  const mismatchedContent = `---
title: "Mismatched Pillar Post"
description: "Filed under technology/ but frontmatter says pillar ai."
pillar: "ai"
tags: ["example"]
publishedAt: "2026-07-18"
draft: false
---

This post's frontmatter pillar disagrees with its directory.
`

  beforeEach(() => {
    fs.mkdirSync(path.dirname(mismatchedPath), { recursive: true })
    fs.writeFileSync(mismatchedPath, mismatchedContent, 'utf-8')
  })

  afterEach(() => {
    fs.rmSync(mismatchedPath, { force: true })
  })

  it('throws when frontmatter.pillar does not match the directory it was read from', () => {
    expect(() => getPostBySlug('technology', 'mismatched-pillar')).toThrow(
      /pillar/i
    )
  })
})
