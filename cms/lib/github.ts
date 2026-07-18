const GITHUB_API = 'https://api.github.com'
const REPO = 'SoujanyaDasRoy/Mavora'

function authHeaders(): Record<string, string> {
  const token = process.env.GITHUB_CONTENT_TOKEN
  if (!token) throw new Error('GITHUB_CONTENT_TOKEN is not set')
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
}

async function getExistingSha(path: string): Promise<string | undefined> {
  const response = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    headers: authHeaders(),
  })
  if (response.status === 404) return undefined
  if (!response.ok) {
    // Any other non-2xx (401 expired/bad token, 403 rate-limited, 5xx
    // outage) must NOT fall through to `data.json()` -- GitHub's error body
    // shape (`{message, documentation_url}`) has no `sha` field, so that
    // would silently return `undefined`, which callers (deleteContentFile)
    // treat identically to "file genuinely doesn't exist." Throwing here
    // instead makes commit/delete failures propagate instead of silently
    // no-op-ing.
    throw new Error(`GitHub existence check failed for ${path}: ${response.status}`)
  }
  const data = (await response.json()) as { sha: string }
  return data.sha
}

export async function commitContentFile(path: string, content: string, message: string): Promise<void> {
  const sha = await getExistingSha(path)
  const base64Content = Buffer.from(content, 'utf-8').toString('base64')

  const response = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ message, content: base64Content, ...(sha ? { sha } : {}) }),
  })

  if (!response.ok) {
    // Note: never include response body/headers here -- GitHub error payloads
    // do not echo back the Authorization header, but we still avoid logging
    // anything beyond status to keep this safe by construction.
    throw new Error(`GitHub commit failed for ${path}: ${response.status}`)
  }
}

export async function deleteContentFile(path: string, message: string): Promise<void> {
  const sha = await getExistingSha(path)
  if (!sha) return // already gone

  const response = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ message, sha }),
  })

  if (!response.ok) {
    throw new Error(`GitHub delete failed for ${path}: ${response.status}`)
  }
}
