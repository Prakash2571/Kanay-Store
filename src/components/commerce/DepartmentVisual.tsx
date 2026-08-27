import {
  Dumbbell,
  Headphones,
  Package,
  Paperclip,
  Shirt,
  Sparkles,
  Utensils,
  Watch,
  Wrench,
} from "lucide-react";
import Image from "next/image";

import { isVectorAsset } from "@/lib/storefront/categoryMedia";
import type { Tint } from "@/lib/storefront/showcase";
import type { StorefrontImage } from "@/lib/storefront/types";

/**
 * A department's visual: its photograph if one exists, otherwise a tinted card.
 *
 * WHY THE FALLBACK IS A DESIGNED STATE, NOT A PLACEHOLDER
 * ------------------------------------------------------
 * There is no guaranteed photograph for a department. Real product imagery arrives from Shopify on
 * a configured store, and a store owner can drop files into `public/categories/`, but a fresh
 * checkout has neither — and the previous answer to that, hard-coded stock URLs, produced a 404 and
 * a miscaptioned photograph in production.
 *
 * So the no-image case is drawn properly rather than apologised for: the department's soft tint, its
 * icon at a large size in the tint's ink colour, and a faint oversized glyph behind it for depth.
 * It reads as a colour-coded category card, which is what the design calls for anyway.
 *
 * This is NOT the icon grid that was removed earlier. That was six equal boxes of thin grey glyphs
 * with nothing else in them. These carry the category's own colour, sit in an asymmetric layout, and
 * are labelled by the caller.
 *
 * The image, when present, is layered ON TOP of the tint, so a file that fails to decode still
 * leaves a coloured card rather than a grey rectangle.
 */

/**
 * One icon per department key. Kept here rather than in `showcase.ts` so that module stays pure and
 * its tests do not have to import a React icon library to check a keyword table.
 */
const DEPARTMENT_ICONS: Record<string, typeof Package> = {
  electronics: Headphones,
  "home-kitchen": Utensils,
  accessories: Watch,
  beauty: Sparkles,
  tools: Wrench,
  office: Paperclip,
  fitness: Dumbbell,
  fashion: Shirt,
};

export function DepartmentVisual({
  departmentKey,
  label,
  tint,
  image,
  sizes,
  priority = false,
  className = "",
}: {
  /** Department key, used to pick the icon. Unknown keys get a neutral parcel icon. */
  departmentKey?: string;
  label: string;
  tint: Tint;
  image: StorefrontImage | null;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const Icon = (departmentKey && DEPARTMENT_ICONS[departmentKey]) || Package;

  return (
    <span className={`relative block overflow-hidden ${tint.surface} ${className}`}>
      {/* Oversized, very low-contrast glyph: gives the empty card depth without adding an asset. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-6 -right-4 opacity-[0.14] ${tint.ink}`}
      >
        <Icon size={132} strokeWidth={1.1} />
      </span>

      <span aria-hidden="true" className={`absolute inset-0 grid place-items-center ${tint.ink}`}>
        <Icon size={34} strokeWidth={1.5} />
      </span>

      {image ? (
        <Image
          alt={image.alt || label}
          className="relative object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          fill
          priority={priority}
          sizes={sizes}
          src={image.url}
          /*
            SVG is passed through untouched. Next's optimiser refuses SVG unless the global
            `dangerouslyAllowSVG` flag is set, and granting that for the whole app to serve eight
            first-party 1KB illustrations is a bad trade - `unoptimized` is the targeted version.
          */
          unoptimized={isVectorAsset(image.url)}
        />
      ) : null}
    </span>
  );
}
