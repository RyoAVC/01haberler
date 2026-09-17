# 1.15.0 production compatibility

The merged PR #1 adds nullable Article.city, Article.district and Source.defaultCity.
Before deploying the combined release run, in the existing production environment:

    node scripts/ensure-local-news-columns.cjs

The script adds only missing nullable text columns in one transaction, with a five-second lock timeout. It does not delete data, rewrite existing values or change permissions. A failure must stop deployment. It can run again safely. The optional city index is deferred to a separately scheduled database operation; it is not required for correctness.

Hostinger only exposes npm run build. This release therefore runs the compatibility step via npm prebuild, before Next.js builds. A reachable database is required for builds. Remove this temporary hook in a subsequent release once all environments have these columns. The equivalent command is:

    node scripts/ensure-local-news-columns.cjs && npm run build

Do not run prisma db push against production for this release.
