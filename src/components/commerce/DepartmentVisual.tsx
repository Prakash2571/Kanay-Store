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
 * A department's visual: its photograph if one exists, otherwise a restrained studio placeholder.
 *
 * WHY THERE IS NO DRAWN PRODUCT HERE ANY MORE
 * ------------------------------------------
 * Two attempts were made at supplying artwork instead of photography: flat vector product shapes,
 * then gradient-shaded ones with highlights and contact shadows. Both were rejected for the same
 * reason, and it was the right call — vector illustration of a physical product reads as a cartoon
 * on a commerce page no matter how much shading is piled onto it. A wholesale buyer sizing up a
 * supplier does not want clip art of a saucepan.
 *
 * So this no longer pretends. The placeholder is what a product photograph would be shot ON: a lit
 * studio sweep in the department's colour, a faint watermark of the department's icon, and nothing
 * else. It reads as a catalogue slot awaiting its photograph, which is exactly what it is, and it
 * cannot be mistaken for an illustration of merchandise.
 *
 * The honest constraint behind all of this: the environment this was built in has no outbound
 * network, so a photograph can be neither downloaded nor verified. See categoryMedia.ts, and
 * scripts/add-category-photo.sh for adding a real one in a single command.
 *
 * The image, when present, is layered ON TOP of the sweep, so a file that fails to decode still
 * leaves a lit surface rather than a grey rectangle.
 */

/**
 * One icon per department key, used only as a low-contrast watermark.
 *
 * Kept here rather than in `showcase.ts` so that module stays pure and its tests do not have to
 * import a React icon library to check a keyword table.
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
  /** Department key, used to pick the watermark icon. Unknown keys get a neutral parcel icon. */
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
    <span className={`relative block overflow-hidden ${tint.sweep} ${className}`}>
      {/*
        A single faint watermark, centred and large. Deliberately NOT a depiction of a product:
        at 7% it reads as a subtle mark on a lit surface rather than as a picture of an object,
        which is the whole difference between "awaiting photography" and "cartoon".
      */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 grid place-items-center opacity-[0.07] ${tint.ink}`}
      >
        <Icon size={96} strokeWidth={1} />
      </span>

      {/* Hairline inset edge, so the sweep reads as a surface with a boundary. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/[0.04]"
      />

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
            `dangerouslyAllowSVG` flag is set, and granting that for the whole app to serve
            first-party artwork is a bad trade - `unoptimized` is the targeted version.
          */
          unoptimized={isVectorAsset(image.url)}
        />
      ) : null}
    </span>
  );
}
