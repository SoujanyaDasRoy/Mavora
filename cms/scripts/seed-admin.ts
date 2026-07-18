// One-time manual setup: run this once, locally, against the REMOTE D1 database,
// after the first-ever writer has logged in at least once (so their row exists
// with role 'writer'), to promote them to 'admin'.
//
// Usage: npx wrangler d1 execute mavora-cms --remote --command \
//   "UPDATE writers SET role = 'admin' WHERE id = 'REPLACE_WITH_CLERK_USER_ID'"
//
// This file documents the one-time step; it is intentionally not an
// automated script, since it should only ever run once by a human who has
// confirmed the correct Clerk user ID from the Clerk dashboard.
export {}
