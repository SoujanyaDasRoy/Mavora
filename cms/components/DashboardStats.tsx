interface Stats {
  draftCount: number
  publishedCount: number
  r2UsedBytes: number
  r2FreeTierBytes: number
}

export function DashboardStats({ stats }: { stats: Stats }) {
  const usedGb = (stats.r2UsedBytes / (1024 * 1024 * 1024)).toFixed(2)
  const freeGb = (stats.r2FreeTierBytes / (1024 * 1024 * 1024)).toFixed(0)

  return (
    <dl>
      <dt>Draft articles</dt>
      <dd>{stats.draftCount}</dd>
      <dt>Published articles</dt>
      <dd>{stats.publishedCount}</dd>
      <dt>Media storage used</dt>
      <dd>{usedGb}GB / {freeGb}GB free tier</dd>
    </dl>
  )
}
