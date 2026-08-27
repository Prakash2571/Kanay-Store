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

`../brand-story.jpg` backs the wide trust banner in the same way.

## Use the helper — it checks the things that broke before

```sh
# one at a time
./scripts/add-category-photo.sh electronics https://example.com/headphones.jpg
./scripts/add-category-photo.sh tools ~/Pictures/our-wrench-set.jpg

# or all eight from a manifest
cp scripts/category-photos.example.txt photos.txt   # edit it
./scripts/add-category-photos.sh photos.txt
```

It verifies HTTP status, sniffs the content type and enforces a minimum file size, so a dead link or
an HTML error page can never land in here. What it *cannot* check is whether the picture shows the
right subject — open the folder afterwards and look.

The dev server picks new files up on the next refresh; no restart needed.

## There is no artwork in this folder, on purpose

Two attempts were made at shipping drawn artwork instead of photographs: flat vector product shapes,
then gradient-shaded ones with highlights and contact shadows. Both were rejected, and correctly —
vector illustration of a physical product reads as a cartoon on a commerce page no matter how much
shading is applied. A wholesale buyer assessing a supplier does not want clip art of a saucepan.

So a department without a photograph now renders a **restrained studio placeholder**: a lit sweep in
the department's colour with a faint watermark of its icon, and nothing else. It reads as a catalogue
slot awaiting its photograph, which is what it is, and it cannot be mistaken for a picture of
merchandise.

The underlying constraint is that the environment this project was built in has no outbound network,
so a photograph can be neither downloaded nor verified there. **Real product photography from Shopify
takes priority over everything here** — once the catalog is connected, none of this renders at all.
