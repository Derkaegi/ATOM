# /spt-deploy — Deploy data-setpiecetakers to Cloudflare Pages

Pushes the latest commits in `~/Projects/data-setpiecetakers` to `origin/main`, triggering a Cloudflare Pages auto-deploy.

## Steps

1. `cd /home/herbert/Projects/data-setpiecetakers`
2. Run `git status` to show what's pending
3. Run `git push origin main`
4. Report the result in NATIVE MODE format

## Notes

- Cloudflare Pages auto-deploys on every push to `main`
- No build step needed locally — Cloudflare handles it
- If nothing to push, report "already up to date"
