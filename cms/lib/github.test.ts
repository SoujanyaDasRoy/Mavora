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
})
