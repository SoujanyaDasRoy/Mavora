# Deploying Mavora to Cloudflare Pages

This site is a static Next.js export (`npm run build` produces a static `out/`
directory). Cloudflare Pages builds and hosts it directly from the GitHub
repo — there is no server to manage.

This repo's GitHub remote is
`https://github.com/SoujanyaDasRoy/Mavora.git`, with `main` as the production
branch. If it hasn't been pushed there yet, push it first — Cloudflare Pages
connects directly to that repo/branch. Everything below happens in the
Cloudflare dashboard and only needs to be done once.

## 1. Create the Cloudflare Pages project

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Authorize Cloudflare to access GitHub if prompted, then select the
   `SoujanyaDasRoy/Mavora` repository.
4. Choose the `main` branch as the production branch.

## 2. Build settings

When Cloudflare asks for the framework/build configuration, set:

| Setting | Value |
|---|---|
| Framework preset | Next.js (Static HTML Export) — or "None" if that preset behaves unexpectedly |
| Build command | `npm run build` |
| Build output directory | `out` |
| Root directory | `/` (repo root) |

## 3. Environment variables

Still in the project setup (or afterward under **Settings → Environment
variables**), add these two variables for the **Production** environment
(and Preview, if you want preview deploys to work too):

| Variable name | Value |
|---|---|
| `NEXT_PUBLIC_FORMSPREE_ID` | Your real Formspree form ID (from the Formspree dashboard, once the account/form exists) |
| `NEXT_PUBLIC_BUTTONDOWN_USERNAME` | Your real Buttondown username (from the Buttondown dashboard, once the account exists) |

These are read at build time (`components/ContactForm.tsx` and
`components/NewsletterSignup.tsx`) and baked into the static HTML/JS, so they
must be set **before** triggering a build. If you change them later, you need
to trigger a new deploy for the change to take effect.

See `.env.example` in the repo root for the exact variable names used
locally — do not commit a real `.env.local` file (it's git-ignored on
purpose).

## 4. Deploy

Click **Save and Deploy**. Cloudflare will clone the repo, run
`npm run build`, and publish the contents of `out/`. This first deploy also
sets up the auto-deploy hook: from now on, every push to `main` triggers a
new build and publish automatically — no manual redeploy step.

## 5. Verify the deploy worked

Cloudflare gives you a URL like `https://<project-name>.pages.dev`. Once the
build finishes (usually 1-2 minutes), open that URL and check:

- `/` — homepage loads
- `/ai` — pillar page loads
- `/ai/example-post` — a sample post renders
- `/about` — static page loads
- `/contact` — the contact form renders and (once `NEXT_PUBLIC_FORMSPREE_ID`
  is set) submits successfully to Formspree
- `/sitemap.xml` — returns XML
- `/robots.txt` — returns plain text
- `/feed.xml` — returns the RSS feed

If any of these 404, double check the build output directory is `out` (not
`.next` or `/`) and that the build log in the Cloudflare dashboard shows
`npm run build` completing without errors.

## 6. Ongoing publishing flow

Once the above is set up, publishing new content is just:

1. Add a new `.mdx` file under `content/posts/<pillar>/`.
2. Commit and push to `main`.
3. Cloudflare Pages automatically rebuilds and republishes — the new post
   appears live within a few minutes, with no manual deploy step required.

## Custom domain (optional, later)

To use a custom domain instead of `*.pages.dev`, go to the Pages project's
**Custom domains** tab and follow Cloudflare's instructions to add and
verify the domain. Not required for the initial launch.
