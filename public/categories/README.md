# Category imagery

Drop a photograph here named after a department key and it appears on the homepage category rail
and, when the catalog has no products of its own, in the hero collage.

| file | department |
| --- | --- |
| `electronics.jpg` | Electronics |
| `home-kitchen.jpg` | Home & Kitchen |
| `accessories.jpg` | Accessories |
| `beauty.jpg` | Beauty & Personal Care |
| `tools.jpg` | Tools & Hardware |
| `office.jpg` | Office & Stationery |
| `fitness.jpg` | Sports & Fitness |
| `fashion.jpg` | Fashion |

`.jpg`, `.jpeg`, `.png`, `.webp` and `.avif` all work. Square or 5:4 crops suit the card best;
around 800px on the long edge is plenty, since the cards render under 300px.

`public/brand-story.jpg` backs the wide trust banner in the same way.

## Nothing here is required

Any department without a file renders as a colour-coded card with its icon, which is a deliberate
part of the design rather than a placeholder. Real product photography from Shopify always takes
priority over both.

## Why these are local files and not stock URLs

They used to be hard-coded `images.unsplash.com` IDs. The build environment has no network access,
so none could be verified, and two of them failed in production: one 404'd, and another resolved to
a photograph of coffee beans under alt text describing a kitchen appliance. A broken image is
obvious; a plausible photograph of the wrong thing silently mislabels a category and lies to screen
readers.

Files are discovered by reading this directory (`src/lib/storefront/categoryMedia.ts`), so the only
images the app ever references are ones that exist. In development the directory is re-read on each
render, so adding a file and refreshing is enough — no restart.
