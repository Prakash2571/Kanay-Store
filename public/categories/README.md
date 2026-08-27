# Category imagery

Drop a photograph here named after a department key and it appears on the homepage category rail
and, when the catalog has no products of its own, in the hero collage.

| file               | department             |
| ------------------ | ---------------------- |
| `electronics.jpg`  | Electronics            |
| `home-kitchen.jpg` | Home & Kitchen         |
| `accessories.jpg`  | Accessories            |
| `beauty.jpg`       | Beauty & Personal Care |
| `tools.jpg`        | Tools & Hardware       |
| `office.jpg`       | Office & Stationery    |
| `fitness.jpg`      | Sports & Fitness       |
| `fashion.jpg`      | Fashion                |

`.jpg`, `.jpeg`, `.png`, `.webp` and `.avif` all work. Square or 5:4 crops suit the card best;
around 800px on the long edge is plenty, since the cards render under 300px.

`../brand-story.jpg` backs the wide trust banner in the same way.

## Default photography

When no owner-supplied file exists, the storefront uses these reviewed Pexels photographs. Each URL
is pinned to a permanent numeric photo ID rather than a changing search result. The Pexels source
page's title and description were checked against the category and alt text on 26 August 2026.
[Pexels permits free commercial use and does not require attribution](https://www.pexels.com/license/).

| department             | verified source                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Electronics            | [Black wireless headphones](https://www.pexels.com/photo/brand-wireless-headphones-16303233/)                                   |
| Home & Kitchen         | [Kitchen counter with stove and rice cooker](https://www.pexels.com/photo/kitchen-counter-with-stove-and-rice-cooker-11770362/) |
| Accessories            | [Smartwatch, pen and notebook](https://www.pexels.com/photo/smartwatch-and-a-pen-on-white-surface-11158742/)                    |
| Beauty & Personal Care | [Amber skincare serum](https://www.pexels.com/photo/close-up-of-squalane-serum-dropper-in-amber-bottle-30229015/)               |
| Tools & Hardware       | [Workshop screwdrivers and wrenches](https://www.pexels.com/photo/organized-workshop-tools-screwdrivers-and-wrenches-30497344/) |
| Office & Stationery    | [Notebook, pencil and envelope](https://www.pexels.com/photo/envelope-pencil-notepads-and-grasses-5712484/)                     |
| Sports & Fitness       | [Pair of dumbbells](https://www.pexels.com/photo/dumbbells-on-asphalt-ground-in-park-4793211/)                                  |
| Fashion                | [Shirts on wooden hangers](https://www.pexels.com/photo/shirts-displayed-on-clothing-rack-11739182/)                            |
| Brand story banner     | [Workers arranging warehouse inventory](https://www.pexels.com/photo/men-working-in-factory-warehouse-4483772/)                 |

A Shopify collection/product image still wins over everything here. A file supplied in this folder
wins over the corresponding Pexels fallback, so the defaults can be replaced without touching code.

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
an HTML error page can never land in here. What it _cannot_ check is whether the picture shows the
right subject — open the folder afterwards and look.

The dev server picks new files up on the next refresh; no restart needed.

## There is no drawn artwork in this folder, on purpose

Two attempts were made at shipping drawn artwork instead of photographs: flat vector product shapes,
then gradient-shaded ones with highlights and contact shadows. Both were rejected, and correctly —
vector illustration of a physical product reads as a cartoon on a commerce page no matter how much
shading is applied. A wholesale buyer assessing a supplier does not want clip art of a saucepan.

If neither Shopify, a local file, nor an approved remote record provides an image, the category
renders a **restrained studio fallback**: a lit sweep in the department's colour with a faint
watermark of its icon, and nothing else. It reads as a catalogue slot awaiting its photograph, and
it cannot be mistaken for a picture of merchandise.

The reviewed Pexels records are remote rather than committed binaries, so their availability still
depends on network access. Their permanent numeric paths, exact subjects and licence are documented
above; local owner photography remains the strongest fallback because the store controls it.
