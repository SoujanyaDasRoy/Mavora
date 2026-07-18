import { describe, it, expect, vi, afterEach } from 'vitest'
import { uploadMediaFile, MediaUploadError, getPublicMediaUrl } from './media-client'

describe('uploadMediaFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts a multipart form with articleId, altText, and file, and returns the parsed JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'm1', r2Key: 'articles/a1/x.webp', altText: 'Alt' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const file = new File([new Uint8Array([1, 2, 3])], 'x.webp', { type: 'image/webp' })
    const result = await uploadMediaFile('a1', file, 'Alt')

    expect(result).toEqual({ id: 'm1', r2Key: 'articles/a1/x.webp', altText: 'Alt' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/media/upload')
    expect(init.method).toBe('POST')
    const body = init.body as FormData
    expect(body.get('articleId')).toBe('a1')
    expect(body.get('altText')).toBe('Alt')
    expect((body.get('file') as File).name).toBe('x.webp')
  })

  it('throws MediaUploadError with the server-provided error message on a non-OK JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Unsupported file type: application/pdf' }),
      })
    )

    const file = new File([new Uint8Array([1])], 'x.pdf', { type: 'application/pdf' })
    await expect(uploadMediaFile('a1', file, '')).rejects.toThrow(/Unsupported file type/)
    await expect(uploadMediaFile('a1', file, '')).rejects.toBeInstanceOf(MediaUploadError)
  })

  it('falls back to a status-based message when the error response body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => {
          throw new Error('not json')
        },
      })
    )

    const file = new File([new Uint8Array([1])], 'x.webp', { type: 'image/webp' })
    await expect(uploadMediaFile('a1', file, '')).rejects.toThrow(/403/)
  })
})

describe('getPublicMediaUrl (re-exported from lib/media.ts)', () => {
  const originalBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL

  afterEach(() => {
    if (originalBase === undefined) delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
    else process.env.NEXT_PUBLIC_MEDIA_BASE_URL = originalBase
  })

  it('is the same function exported by lib/media.ts', () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://media.example.com'
    expect(getPublicMediaUrl('articles/a1/cover.webp')).toBe('https://media.example.com/articles/a1/cover.webp')
  })
})
