import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { commitContentFile, deleteContentFile } from './github'

const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = vi.fn()
  // commitContentFile/deleteContentFile require GITHUB_CONTENT_TOKEN to be
  // set (authHeaders throws otherwise). fetch is fully mocked below, so the
  // actual token value is irrelevant here -- this just satisfies the guard.
  vi.stubEnv('GITHUB_CONTENT_TOKEN', 'test-token')
})

afterEach(() => {
  global.fetch = originalFetch
  vi.unstubAllEnvs()
})

describe('commitContentFile', () => {
  it('PUTs base64-encoded content to the GitHub Contents API', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 404 })) // no existing file
      .mockResolvedValueOnce(new Response(JSON.stringify({ content: {} }), { status: 201 }))

    await commitContentFile('content/posts/ai/my-post.mdx', '---\ntitle: "x"\n---\nBody', 'publish: my-post')

    const putCall = (global.fetch as any).mock.calls[1]
    expect(putCall[0]).toContain('content/posts/ai/my-post.mdx')
    const body = JSON.parse(putCall[1].body)
    expect(Buffer.from(body.content, 'base64').toString('utf-8')).toBe('---\ntitle: "x"\n---\nBody')
    expect(body.message).toBe('publish: my-post')
  })
})

describe('deleteContentFile', () => {
  it('DELETEs the file using its current sha', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce(new Response(JSON.stringify({ sha: 'abc123' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    await deleteContentFile('content/posts/ai/my-post.mdx', 'unpublish: my-post')

    const deleteCall = (global.fetch as any).mock.calls[1]
    const body = JSON.parse(deleteCall[1].body)
    expect(body.sha).toBe('abc123')
  })

  it('treats a genuine 404 as "already absent" and no-ops without throwing (regression guard)', async () => {
    ;(global.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Not Found', documentation_url: 'https://x' }), { status: 404 })
    )

    await expect(deleteContentFile('content/posts/ai/gone.mdx', 'unpublish: gone')).resolves.toBeUndefined()
    // Only the GET happened; no DELETE should have been attempted.
    expect((global.fetch as any).mock.calls.length).toBe(1)
  })

  it('throws instead of silently no-op-ing when GitHub returns a non-404 error (e.g. expired token)', async () => {
    ;(global.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Bad credentials', documentation_url: 'https://x' }), { status: 401 })
    )

    await expect(deleteContentFile('content/posts/ai/my-post.mdx', 'unpublish: my-post')).rejects.toThrow()
    // Must not have proceeded to attempt the DELETE with an undefined sha.
    expect((global.fetch as any).mock.calls.length).toBe(1)
  })

  it('throws when GitHub rate-limits the existence check (403)', async () => {
    ;(global.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'API rate limit exceeded', documentation_url: 'https://x' }), { status: 403 })
    )

    await expect(deleteContentFile('content/posts/ai/my-post.mdx', 'unpublish: my-post')).rejects.toThrow()
  })
})
