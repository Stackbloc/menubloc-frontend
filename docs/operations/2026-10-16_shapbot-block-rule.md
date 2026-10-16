# ShapBot block rule — DRAFT, NOT APPLIED

Status: waiting for Andre's approval. Nothing in this file has been applied to Cloudflare or Vercel.

## Why

Sep 16 – Oct 16 Vercel usage (Hobby): 1,003,889 / 1,000,000 CDN requests and 293,575 function
invocations, of which 293,569 were the SEO middleware (`middleware.js`). Both spiked Oct 9–14
(about 210K CDN requests/day at peak, against a baseline of about 5–15K), then dropped back on Oct 15.

Railway HTTP logs from the same days show ~88% of backend requests carrying
`Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ShapBot/0.1.0`, from Google Cloud and
AWS IPs (34.122.173.216, 23.251.146.115, 34.44.x, 54.236.x, 3.94.x). It renders the SPA (it calls
`/auth/me`, `/api/analytics/page-visit`, etc.), so every page it crawls costs one middleware invocation
plus the document, shell and asset CDN requests. `/api/analytics/page-visit` went from ~15K per 12h to
16 per 12h when it stopped. It is not a Vercel-verified bot, and nobody has identified its operator.

## Where to apply

`menuply.com`, `www.menuply.com` and `crm.menuply.com` are proxied by Cloudflare (`server: cloudflare`,
Cloudflare NS), so blocking there stops the request **before it reaches Vercel**: no CDN request, no
invocation. `grubbid.com` uses Vercel DNS and goes straight to Vercel, so it needs the Vercel rule too.
It only 301s to menuply.com, but a crawler still costs one CDN request per URL there.

### 1. Cloudflare (primary) — zone `menuply.com`

Security → WAF → Custom rules → Create rule

- Name: `Block ShapBot crawler`
- Expression (Edit expression):

  ```
  (http.user_agent contains "ShapBot")
  ```

- Action: **Block**. Use Block, not Managed Challenge, because a headless browser can sometimes pass a challenge.
- Place it first in the list.

### 2. Vercel Firewall (backup; covers grubbid.com and *.vercel.app) — project `menubloc-frontend`

Security → Firewall → Rules → Add New → Custom Rule

- Name: `Block ShapBot crawler`
- If: `User Agent` `Contains` `ShapBot`
- Then: **Deny**
- Save, then **Publish** (Firewall changes are staged until published).

### 3. robots.txt (in this branch)

`public/robots.txt` adds `User-agent: ShapBot` / `Disallow: /`. This only helps if the crawler honors
robots.txt, so it isn't a substitute for 1 and 2.

## Verify after applying

1. Run `curl -s -o /dev/null -w "%{http_code}\n" -A "Mozilla/5.0 (compatible; ShapBot/0.1.0)" https://menuply.com/`
   and expect `403`. Run it again without `-A`; expect `200`.
2. Check Cloudflare → Security → Events, filtered by the rule name, for matches if the bot returns.
3. Check Vercel → Usage → CDN Requests and Function Invocations: daily bars should stay near baseline.
4. Check Railway HTTP logs: `ShapBot` should not appear in `clientUa`.

## Rollback

Disable or delete the rule in Cloudflare (takes effect immediately) and in Vercel Firewall (re-publish).

## Optional hardening (not part of this draft)

Add a Cloudflare rate-limiting rule on `/restaurants/*` per IP, e.g. 60 requests/min, action Managed
Challenge. This guards against the next unknown crawler, but needs tuning so Googlebot and other verified
bots aren't slowed. Exempt them with `not cf.client.bot`.
