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

## A rendered product shot ships for every department

`<key>.svg` is committed for all eight, so no card is ever empty. Each is a product on a studio
backdrop, drawn with gradient shading, specular highlights, a contact shadow and a film-grain
overlay — the look of a catalogue product shot rather than a flat icon. `../brand-story.svg` does the
same for the wide trust banner.

Backdrop and product tones are read out of that department's tint tokens in `src/app/globals.css` by
the generator, so the artwork can never drift from the palette.

**They are drawn, not photographed**, because the environment they were made in has no outbound
network: a real photograph can be neither downloaded nor verified there. That is not a preference,
and a genuine photograph is better — see below.

**A raster file beats the SVG.** Drop `electronics.jpg` in and it wins over `electronics.svg`
automatically — nothing needs deleting. Precedence is the order of `IMAGE_EXTENSIONS` in
`src/lib/storefront/categoryMedia.ts`: jpg, jpeg, png, webp, avif, then svg last.

The helper checks the things that went wrong before — HTTP status, content type, file size:

```sh
./scripts/add-category-photo.sh electronics https://example.com/headphones.jpg
./scripts/add-category-photo.sh tools ~/Pictures/our-wrench-set.jpg
```

It refuses to write anything that is not a real image, so a 404 or an error page can never land in
here. What it cannot check is whether the picture shows the right *subject* — that step is yours.

Real product photography from Shopify takes priority over both.

## Why these are local files and not stock URLs

They used to be hard-coded `images.unsplash.com` IDs. The build environment has no network access,
so none could be verified, and two of them failed in production: one 404'd, and another resolved to
a photograph of coffee beans under alt text describing a kitchen appliance. A broken image is
obvious; a plausible photograph of the wrong thing silently mislabels a category and lies to screen
readers.

Files are discovered by reading this directory (`src/lib/storefront/categoryMedia.ts`), so the only
images the app ever references are ones that exist. In development the directory is re-read on each
render, so adding a file and refreshing is enough — no restart.
