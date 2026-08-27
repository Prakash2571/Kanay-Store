import { z } from "zod";

export const currencyCodeSchema = z.literal("INR");

export const moneySchema = z.object({
  amount: z.union([z.string(), z.number()]).transform(String),
  currencyCode: currencyCodeSchema,
});

export const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().nullable().optional().transform((value) => value ?? ""),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

export const selectedOptionSchema = z.object({
  name: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

export const collectionReferenceSchema = z.object({
  id: z.string().min(1),
  handle: z.string().min(1),
  title: z.string().min(1),
});

export const storefrontVariantSchema = z.object({
  id: z.string().min(1),
  shopifyVariantId: z.string().min(1),
  title: z.string().min(1),
  selectedOptions: z.array(selectedOptionSchema).default([]),
  skuPublic: z.string().nullable().optional(),
  availableForSale: z.boolean(),
  availability: z.enum(["SELLABLE", "OUT_OF_STOCK", "UNAVAILABLE"]),
  price: moneySchema,
  compareAtPrice: moneySchema.nullable().optional(),
  image: imageSchema.nullable().optional(),
});

export const quickAddVariantSchema = storefrontVariantSchema.pick({
  id: true,
  shopifyVariantId: true,
  title: true,
  selectedOptions: true,
  availableForSale: true,
  availability: true,
  price: true,
  image: true,
});

export const priceRangeSchema = z.object({
  min: moneySchema,
  max: moneySchema,
});

export const productSummarySchema = z.object({
  id: z.string().min(1),
  shopifyProductId: z.string().min(1),
  handle: z.string().min(1),
  title: z.string().min(1),
  descriptionExcerpt: z.string().default(""),
  productType: z.string().nullable().optional(),
  vendorPublicName: z.string().nullable().optional(),
  images: z.array(imageSchema).default([]),
  priceRange: priceRangeSchema,
  compareAtPriceRange: priceRangeSchema.nullable().optional(),
  availableForSale: z.boolean(),
  availability: z.enum(["SELLABLE", "OUT_OF_STOCK", "UNAVAILABLE"]),
  collections: z.array(collectionReferenceSchema).default([]),
  quickAddVariant: quickAddVariantSchema.nullable().optional(),
  /**
   * Wholesale minimum order quantity, set by the merchant on the product.
   *
   * Optional and nullable on purpose: null means NO minimum (not one), and `optional` keeps
   * this schema compatible with a backend that has not yet deployed the field - the
   * storefront then shows no MOQ rather than failing to parse the catalog.
   */
  minimumOrderQuantity: z.number().int().positive().nullable().optional(),
});

export const productDetailSchema = productSummarySchema.extend({
  description: z.string().default(""),
  variants: z.array(storefrontVariantSchema),
  options: z
    .array(
      z.object({
        name: z.string().min(1),
        values: z.array(z.string().min(1)),
      }),
    )
    .default([]),
  seo: z
    .object({
      title: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const collectionSummarySchema = z.object({
  id: z.string().min(1),
  handle: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  image: imageSchema.nullable().optional(),
  seo: z
    .object({
      title: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const pageInfoSchema = z.object({
  hasNextPage: z.boolean().default(false),
  endCursor: z.string().nullable().default(null),
});

export const catalogFiltersSchema = z.object({
  collections: z.array(collectionSummarySchema).default([]),
  productTypes: z.array(z.string()).default([]),
  priceRange: priceRangeSchema.nullable().optional(),
});

export const catalogDataSchema = z.object({
  products: z.array(productSummarySchema),
  pageInfo: pageInfoSchema,
  filters: catalogFiltersSchema,
});

export const collectionDetailDataSchema = z.object({
  collection: collectionSummarySchema,
  products: z.array(productSummarySchema),
  pageInfo: pageInfoSchema,
});

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;
export type Money = z.infer<typeof moneySchema>;
export type StorefrontImage = z.infer<typeof imageSchema>;
export type SelectedOption = z.infer<typeof selectedOptionSchema>;
export type StorefrontVariant = z.infer<typeof storefrontVariantSchema>;
export type StorefrontProductSummary = z.infer<typeof productSummarySchema>;
export type StorefrontProduct = z.infer<typeof productDetailSchema>;
export type StorefrontCollectionSummary = z.infer<typeof collectionSummarySchema>;
export type StorefrontCatalogData = z.infer<typeof catalogDataSchema>;
export type StorefrontCollectionData = z.infer<typeof collectionDetailDataSchema>;

export type StorefrontApiError = {
  code: string;
  message: string;
  status?: number;
};

export type StorefrontResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: StorefrontApiError };

export type CatalogSort = "FEATURED" | "NEWEST" | "PRICE_ASC" | "PRICE_DESC";

export type CatalogQuery = {
  q?: string;
  collection?: string;
  productType?: string;
  availability?: "SELLABLE";
  minPricePaise?: number;
  maxPricePaise?: number;
  sort?: CatalogSort;
  first?: number;
  after?: string;
};

export type CartProductItem = {
  shopifyProductId: string;
  shopifyVariantId: string;
  handle: string;
  title: string;
  variantTitle: string;
  selectedOptions: SelectedOption[];
  image: StorefrontImage | null;
  unitPricePaise: number;
  currencyCode: "INR";
  availableForSale: boolean;
  /**
   * The product's wholesale minimum, carried into the cart so a line cannot be decremented
   * below what the checkout will accept. Null or absent means no minimum.
   */
  minimumOrderQuantity?: number | null;
};
