# Mavora PRD v1.2

_Last updated: 2026-07-18 — solo operator, $0 budget, ship fast_

## Mission
Help ambitious students, professionals, creators and founders understand technology, AI, productivity and business in a practical, actionable way.

## Product Type
Digital Media Publication

## Target Audience
- Students (18–25)
- Young Professionals (22–35)
- Builders, creators, founders

## Content Pillars
### AI
- AI tools
- AI workflows
- AI tutorials

### Technology
- Apple
- Google
- Microsoft
- Hardware

### Productivity
- Learning systems
- Time management
- Knowledge management

### Business
- Startups
- Founder stories
- Growth breakdowns

## What Mavora Will Not Publish
- Celebrity gossip
- Politics
- Sports
- Clickbait
- Crypto hype
- Fake AI news

## Core Value Proposition
Well-researched explanations of technology, business and productivity that help readers make better decisions.

## Differentiation
Most AI/tech/productivity publications publish generic listicles or rehashed news. Mavora differentiates by:
- **Operator lens**: written from a founder/builder perspective (technical founder in-house), not just journalists summarizing press releases
- **Actionable format**: every article ends with a concrete takeaway, framework, or checklist — not just explanation
- **Data-backed where possible**: real numbers, screenshots, workflows over opinion
- **No fluff, no clickbait**: explicit ban on hype (already in "Will Not Publish") is a stated brand promise, not just a filter

## Editorial Standards
- **Fact-checking**: every article reviewed by Editorial Lead before publish; claims about tools/products verified firsthand where feasible
- **Sourcing**: primary sources (official docs, company announcements, direct testing) preferred over secondary aggregation
- **AI-assisted writing policy**: AI tools may assist with research, outlining, or first-draft generation, but every article requires human fact-check and edit before publishing. No fully AI-generated, unreviewed content. Disclose AI assistance where material (e.g., AI-generated images).
- **Corrections policy**: factual errors corrected within 48 hours of report, with a visible correction note on the article
- Public-facing "Editorial Standards" page linking to this policy (builds trust + supports Google's E-E-A-T guidelines)

## Team Roles
Solo operator — not a company, no hires. One person (Founder) covers all roles:
- Website & tech
- SEO & analytics
- Research, writing, editing
- Social media & distribution

Revisit hiring/freelance only after revenue (Stage 2+) makes it self-funding — not before.

## MVP Requirements

### Public Website
- Homepage
- Category pages
- Article pages
- About page (includes author bios/credentials for E-E-A-T)
- Contact page
- Editorial Standards page
- Privacy Policy page
- Terms of Use page
- Affiliate Disclosure page (required before any affiliate links go live)
- Email signup (newsletter capture, live from launch — see Email & Newsletter)

### CMS — simplified for solo speed
No custom CMS build at MVP. A login system, dashboard, and rich text editor are real dev-weeks for zero payoff when there's only one author. Instead:
- Content authored as Markdown/MDX files directly in the Git repo
- "Publishing" = write file, git commit, push → Cloudflare Pages auto-deploys
- Drafts = files on a branch or in a `/drafts` folder not yet merged
- SEO fields (title, meta description, OG image) as frontmatter in each file
- No login, no D1 database, no R2 needed for content at this stage — cut entirely from MVP
- Revisit a real CMS (Admin/Editor roles, browser-based editor) only if/when: (a) a second writer joins, or (b) editing via GitHub/code becomes the actual bottleneck

## Email & Newsletter
Moving email capture to Day 1 instead of waiting for Stage 3 (Revenue Roadmap) — list-building compounds and costs nothing to start.
- Embed simple signup form on homepage/article pages at launch
- Use a free-tier ESP initially (e.g., Buttondown or ConvertKit free tier) — no build cost
- No send cadence required at launch; start sending once 100+ subscribers or Month 3, whichever first

## Performance Targets
SEO-driven traffic depends on Core Web Vitals. Targets:
- LCP < 2.5s
- CLS < 0.1
- INP < 200ms
- Achieved via Next.js image optimization + Cloudflare edge caching; monitor via PageSpeed Insights / Search Console monthly

## Legal & Compliance
- Privacy Policy (required for GA/cookies)
- Terms of Use
- Cookie consent banner (minimal, GA-compliant)
- Affiliate Disclosure (FTC-compliant), published before Stage 2 (Affiliate Marketing) begins
- Revisit compliance scope when Sponsored Content (Stage 4) begins

## Budget
$0 target — no spend until there's revenue to justify it.
- Cloudflare Pages: free tier
- ESP (email): free tier (Buttondown/ConvertKit free tier, <1,000 subscribers)
- Stock/image tools: free sources only (Unsplash, self-made screenshots)
- Privacy Policy / Terms / Affiliate Disclosure: free generator templates, no lawyer
- Domain (~$10–15/yr) is the one near-unavoidable cost; if even that's off the table, launch on a free Cloudflare Pages subdomain first and buy the domain once first revenue lands
- No paid tools, no freelancers, no ads spend until Stage 2+ revenue funds it

## Tech Stack

### Frontend
- Next.js, content as Markdown/MDX in-repo (see CMS section)

### Hosting
- Cloudflare Pages (free tier)

### Backend / Database / Storage
- Not needed at MVP — static/Git-based content has no server or DB dependency. Add Cloudflare Workers/D1/R2 later only if a real feature needs them (e.g., comments, search index, real CMS).

### Analytics
- Google Analytics
- Google Search Console

## SEO Requirements
- Sitemap
- Robots.txt
- Canonical URLs
- Open Graph
- Schema.org Article
- RSS Feed

### SEO Strategy (tactics, not just plumbing)
- Keyword clustering per content pillar; one "cornerstone" article per pillar published first, supporting articles link back to it
- Internal linking required on every article (min. 2–3 links to related pieces)
- Backlink outreach: guest posts, HARO/Qwoted-style journalist requests, community engagement (Reddit/X) driving links, not just traffic
- Expect 3–6 month lag before organic traffic materializes on a new domain — Month 1 visitor target (100+) should come primarily from social distribution, not search

## Content Strategy
- 70% Evergreen
- 30% News

### Daily Workflow
Solo, so pace must be sustainable long-term without burnout:
- **Floor (minimum sustainable)**: 3–4 articles/week, 3 social posts/week
- **Stretch (target)**: 1 article/day, 1 social post/day (alternate Instagram/LinkedIn rather than both daily)
- Original PRD's "2 articles/day + carousel + 2 LinkedIn posts/day" is not realistic solo without pay — dropped as a daily requirement
- Lean on AI-assisted drafting (per Editorial Standards' AI policy) to sustain pace solo
- Revisit bringing on a freelance writer only once Stage 2+ revenue funds it

## Distribution Channels
### Primary
- LinkedIn
- Instagram

### Secondary
- Reddit
- X/Twitter

## Success Metrics

### Month 1
- 20–30 articles
- 100+ visitors

### Month 3
- 100 articles
- 1,000+ monthly visitors

### Month 6
- 200+ articles
- 5,000+ monthly visitors
- First revenue

## Revenue Roadmap

### Stage 1
Audience Growth (no revenue yet — build traffic + email list)

### Stage 2
Google AdSense + Affiliate Marketing (run in parallel, both $0 to start)
- AdSense: apply once site has ~20–30 quality articles, Privacy Policy live, and meets AdSense content policies
- Affiliate: join free affiliate programs relevant to content pillars (AI tools, productivity apps, hardware) once Affiliate Disclosure page is live

### Stage 3
Newsletter monetization (sponsorship slots once list is large enough)

### Stage 4
Direct Sponsored Content (once traffic/authority justify brand deals)

## Founder Rule
Do not obsess over branding, redesigns, or features.

Focus on:
- Publishing consistently
- Improving article quality
- Growing organic traffic
- Building audience trust

## Launch Timeline
Solo + Git-based content (no custom CMS build) means launch is days, not weeks:
- **Days 1–3** (by 2026-07-21): Next.js site live on Cloudflare Pages — homepage, category/article templates, About, Contact, Editorial Standards, Privacy/Terms/Affiliate Disclosure, email signup
- **Days 4–7** (by 2026-07-25): First cornerstone articles published (1 per pillar), distribution channels active, AdSense application submitted once policy pages + articles are live
- **Month 1** (by 2026-08-18): 20–30 articles, 100+ visitors
- **Month 3** (by 2026-10-18): 100 articles, 1,000+ monthly visitors, AdSense + affiliate live, email list active
- **Month 6** (by 2027-01-18): 200+ articles, 5,000+ monthly visitors, first revenue

## Vision Statement
Mavora is a trusted publication for ambitious people navigating technology, AI, business and productivity.
