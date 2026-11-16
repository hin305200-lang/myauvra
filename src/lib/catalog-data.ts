import { PHOTOS, photo } from "./photos";

const gold = { name: "Yellow gold", hex: "#C6A15B" };
const white = { name: "White gold", hex: "#E4E0D8" };
const platinum = { name: "Platinum", hex: "#D5D2CC" };

export type CatalogColor = { name: string; hex: string };

export type CatalogProduct = {
  slug: string;
  name: string;
  category: "rings" | "necklaces" | "earrings" | "bracelets";
  price: number;
  salePrice?: number;
  material: string;
  gemstone?: string;
  description: string;
  details: string;
  images: string[];
  featured?: boolean;
  bestSeller?: boolean;
  isNew?: boolean;
  collections: string[];
  sizes: string[];
  colors: CatalogColor[];
};

const piece = (
  product: CatalogProduct,
): CatalogProduct => product;

export const CATEGORIES = [
  { slug: "rings", name: "Rings", description: "Bands, signets, and solitaires finished to sit close to the hand.", image: photo(PHOTOS.diamond), position: 1 },
  { slug: "necklaces", name: "Necklaces", description: "Chains, pendants, and strands drawn to the line of the collarbone.", image: photo(PHOTOS.necklace), position: 2 },
  { slug: "earrings", name: "Earrings", description: "Studs, drops, and hoops with a quiet weight.", image: photo(PHOTOS.earrings), position: 3 },
  { slug: "bracelets", name: "Bracelets", description: "Cuffs, bangles, and lines of light for the wrist.", image: photo(PHOTOS.bangle), position: 4 },
];

export const COLLECTIONS = [
  { slug: "the-bridal-atelier", name: "The Bridal Atelier", description: "Pieces chosen for ceremonies, and for the days that follow them.", image: photo(PHOTOS.portrait), featured: true, position: 1 },
  { slug: "everyday-gold", name: "Everyday Gold", description: "Jewelry meant to be worn with a shirt cuff, a coat, a bare shoulder.", image: photo(PHOTOS.goldStill), featured: true, position: 2 },
  { slug: "signature-stones", name: "Signature Stones", description: "Diamonds, sapphires, and emeralds selected for character rather than size alone.", image: photo(PHOTOS.stones), featured: true, position: 3 },
  { slug: "new-season", name: "New Season", description: "The latest work to leave the bench.", image: photo(PHOTOS.tray), featured: false, position: 4 },
];

export const CATALOG: CatalogProduct[] = [
  piece({
    slug: "solenne-ring",
    name: "The Solenne Ring",
    category: "rings",
    price: 480000,
    material: "18k yellow gold",
    gemstone: "Diamond",
    description: "A slender knife-edge band and a single oval diamond, held low so the stone reads as light rather than display.",
    details: "Oval diamond in a low bezel. The band is 1.6 mm, tapered and polished by hand. Available in yellow or white gold. Sizes 5–8 are stocked; other sizes are finished to order.",
    images: [photo(PHOTOS.diamond), photo(PHOTOS.handRing), photo(PHOTOS.solitaire)],
    featured: true,
    bestSeller: true,
    collections: ["the-bridal-atelier", "signature-stones"],
    sizes: ["5", "6", "7", "8"],
    colors: [gold, white],
  }),
  piece({
    slug: "lune-signet",
    name: "The Lune Signet",
    category: "rings",
    price: 220000,
    material: "18k yellow gold",
    gemstone: "Diamond",
    description: "An oval signet with a soft dome and a scattering of diamonds along one shoulder.",
    details: "Face 12 × 10 mm. The interior is engraved with the Auvra mark. Designed to be worn every day, on the index or the little finger.",
    images: [photo(PHOTOS.bands), photo(PHOTOS.stack)],
    collections: ["everyday-gold"],
    sizes: ["5", "6", "7", "8"],
    colors: [gold],
  }),
  piece({
    slug: "celeste-sapphire",
    name: "Céleste Sapphire",
    category: "rings",
    price: 760000,
    material: "Platinum",
    gemstone: "Sapphire",
    description: "A cushion sapphire the color of deep water, set in platinum with a whisper of diamonds at the gallery.",
    details: "Cushion sapphire, approximately 1.4 ct, with a hidden diamond halo. The platinum band is rounded and unadorned. Made in small numbers.",
    images: [photo(PHOTOS.ringMacro), photo(PHOTOS.sparkle)],
    featured: true,
    collections: ["the-bridal-atelier", "signature-stones"],
    sizes: ["5", "6", "7", "8"],
    colors: [platinum],
  }),
  piece({
    slug: "etoile-band",
    name: "Étoile Band",
    category: "rings",
    price: 265000,
    salePrice: 238000,
    material: "18k white gold",
    gemstone: "Diamond",
    description: "A continuous line of old-cut diamonds, set low enough to sit beside a solitaire or to be worn alone.",
    details: "Approximately 0.35 ct total. Shared-prong setting, polished rails. A quiet pairing ring, or a wedding band with a little weather in the stones.",
    images: [photo(PHOTOS.solitaire), photo(PHOTOS.bands)],
    bestSeller: true,
    collections: ["signature-stones", "the-bridal-atelier"],
    sizes: ["5", "6", "7", "8"],
    colors: [white],
  }),
  piece({
    slug: "noir-onyx-signet",
    name: "Noir Onyx Signet",
    category: "rings",
    price: 98000,
    material: "18k yellow gold",
    gemstone: "Onyx",
    description: "A flat onyx tablet in a thin gold bezel. Graphic, and deliberately unfussy.",
    details: "Onyx 11 × 9 mm. The gold is high-polish on the bezel and brushed on the shank. A piece for people who already own the diamonds.",
    images: [photo(PHOTOS.ringBox), photo(PHOTOS.goldHand)],
    collections: ["everyday-gold"],
    sizes: ["6", "7", "8"],
    colors: [gold],
  }),
  piece({
    slug: "aurelie-pendant",
    name: "Aurélie Pendant",
    category: "necklaces",
    price: 340000,
    material: "18k yellow gold",
    gemstone: "Diamond",
    description: "A single pear-shaped diamond on a trace chain, balanced to fall at the hollow of the throat.",
    details: "Pear diamond in a three-claw setting. Chain 42 or 45 cm, with a lobster clasp finished by hand. The pendant moves, rather than sitting stiffly.",
    images: [photo(PHOTOS.pendant), photo(PHOTOS.portrait), photo(PHOTOS.necklace)],
    bestSeller: true,
    collections: ["signature-stones"],
    sizes: ["42 cm", "45 cm"],
    colors: [gold],
  }),
  piece({
    slug: "rivage-pearls",
    name: "Rivage Pearl Strand",
    category: "necklaces",
    price: 620000,
    material: "18k yellow gold",
    gemstone: "Pearl",
    description: "A single strand of slightly irregular pearls, chosen so the necklace looks collected rather than matched by machine.",
    details: "Akoya pearls, 6.5–7 mm, with a gold barrel clasp. 42 or 45 cm. Each strand is strung in the atelier and knotted between pearls.",
    images: [photo(PHOTOS.pearls), photo(PHOTOS.pearlHand)],
    featured: true,
    collections: ["the-bridal-atelier"],
    sizes: ["42 cm", "45 cm"],
    colors: [gold],
  }),
  piece({
    slug: "linea-chain",
    name: "Linea Chain",
    category: "necklaces",
    price: 86000,
    material: "18k yellow gold",
    description: "A fine trace chain with nothing on it. The piece most of the atelier wears to work.",
    details: "1.2 mm trace chain. 42 or 45 cm. Strong enough for a small pendant, quiet enough without one. Clasp is gold, not plated.",
    images: [photo(PHOTOS.chain), photo(PHOTOS.portrait)],
    isNew: true,
    collections: ["everyday-gold", "new-season"],
    sizes: ["42 cm", "45 cm"],
    colors: [gold],
  }),
  piece({
    slug: "vespera-locket",
    name: "Vespera Locket",
    category: "necklaces",
    price: 168000,
    material: "18k yellow gold",
    description: "A small oval locket with a brushed face and a mirror-polished rim. It opens. What you put inside is your affair.",
    details: "Locket 18 × 14 mm, hinged, with space for a photograph or a lock of hair. Supplied on the Linea chain. Not engraved unless you ask.",
    images: [photo(PHOTOS.necklace), photo(PHOTOS.goldStill)],
    isNew: true,
    collections: ["new-season", "everyday-gold"],
    sizes: ["45 cm"],
    colors: [gold],
  }),
  piece({
    slug: "goutte-drops",
    name: "Goutte Diamond Drops",
    category: "earrings",
    price: 410000,
    material: "18k yellow gold",
    gemstone: "Diamond",
    description: "Two pear diamonds, suspended so they move when you turn your head and stay still when you don’t.",
    details: "Pear diamonds, approximately 0.40 ct total. Shepherd’s hooks with a stop, so they sit close. Also made with posts on request.",
    images: [photo(PHOTOS.drops), photo(PHOTOS.earrings)],
    bestSeller: true,
    collections: ["the-bridal-atelier", "signature-stones"],
    sizes: ["One size"],
    colors: [gold, white],
  }),
  piece({
    slug: "halo-studs",
    name: "Halo Studs",
    category: "earrings",
    price: 290000,
    material: "Platinum",
    gemstone: "Diamond",
    description: "Round brilliants with a tight halo. Bright, but not large. The earring for a neckline that is already doing the talking.",
    details: "Center stones approximately 0.20 ct each, with a micro halo. Platinum posts and gold butterfly backs. A velvet box, of course.",
    images: [photo(PHOTOS.earrings), photo(PHOTOS.sparkle)],
    collections: ["signature-stones"],
    sizes: ["One size"],
    colors: [platinum],
  }),
  piece({
    slug: "perle-bouton",
    name: "Perle Bouton",
    category: "earrings",
    price: 48000,
    material: "18k yellow gold",
    gemstone: "Pearl",
    description: "Button pearls on a gold cup. The first pair, or the pair you lend and never quite get back.",
    details: "6 mm button pearls. Friction posts. The cup is gold all the way through, so the edge does not wear to another color.",
    images: [photo(PHOTOS.pearlHand), photo(PHOTOS.pearls)],
    isNew: true,
    collections: ["everyday-gold", "new-season"],
    sizes: ["One size"],
    colors: [gold],
  }),
  piece({
    slug: "arc-hoops",
    name: "Arc Hoops",
    category: "earrings",
    price: 74000,
    material: "18k yellow gold",
    description: "A 22 mm hoop, round in section, with a hinge that closes cleanly. No charms. No logos.",
    details: "Tube diameter 1.5 mm. Hinged closure with a click you can hear. Light enough for a full day, present enough to be noticed.",
    images: [photo(PHOTOS.editorial), photo(PHOTOS.earrings)],
    collections: ["everyday-gold"],
    sizes: ["One size"],
    colors: [gold],
  }),
  piece({
    slug: "tresse-bangle",
    name: "Tresse Bangle",
    category: "bracelets",
    price: 240000,
    material: "18k yellow gold",
    description: "Three strands of gold, loosely twisted and then polished until the twist almost disappears.",
    details: "Hinged oval bangle, interior about 58 × 48 mm. The hinge is inset so it does not catch on a cuff. A piece that looks simple from across a table.",
    images: [photo(PHOTOS.bangle), photo(PHOTOS.bracelet)],
    featured: true,
    collections: ["everyday-gold"],
    sizes: ["Small", "Medium"],
    colors: [gold],
  }),
  piece({
    slug: "lumiere-tennis",
    name: "Lumière Tennis Bracelet",
    category: "bracelets",
    price: 980000,
    material: "18k white gold",
    gemstone: "Diamond",
    description: "A line of diamonds set so closely that the metal nearly vanishes. For evenings, and for people who do not wait for evenings.",
    details: "Approximately 3 ct total, round brilliants in a four-prong setting. Box clasp with a figure-eight safety. 16 or 17.5 cm.",
    images: [photo(PHOTOS.bracelet), photo(PHOTOS.sparkle), photo(PHOTOS.stones)],
    featured: true,
    bestSeller: true,
    collections: ["the-bridal-atelier", "signature-stones"],
    sizes: ["16 cm", "17.5 cm"],
    colors: [white],
  }),
  piece({
    slug: "chaine-fine",
    name: "Chaîne Fine",
    category: "bracelets",
    price: 64000,
    material: "18k yellow gold",
    description: "The Linea chain, shortened for the wrist. Often bought with the necklace. Often worn without it.",
    details: "1.2 mm trace chain. Adjustable 16–18 cm with a small ring at the clasp. A single piece of gold, not a plated chain.",
    images: [photo(PHOTOS.chain), photo(PHOTOS.goldStill)],
    isNew: true,
    collections: ["everyday-gold", "new-season"],
    sizes: ["16–18 cm"],
    colors: [gold],
  }),
  piece({
    slug: "emeraude-cuff",
    name: "Émeraude Cuff",
    category: "bracelets",
    price: 840000,
    material: "18k yellow gold",
    gemstone: "Emerald",
    description: "An open cuff with one emerald, bezel-set off center. The gold is wide enough to feel architectural and thin enough to forget.",
    details: "Emerald approximately 0.8 ct, minor garden, which we prefer to a blank stone. Cuff opens at the underside. Interior polished smooth.",
    images: [photo(PHOTOS.emerald), photo(PHOTOS.bangle)],
    featured: true,
    collections: ["signature-stones"],
    sizes: ["Small", "Medium"],
    colors: [gold],
  }),
  piece({
    slug: "orme-climbers",
    name: "Orme Ear Climbers",
    category: "earrings",
    price: 156000,
    material: "18k yellow gold",
    gemstone: "Diamond",
    description: "A short climb of gold and three small diamonds, following the ear rather than hanging from it.",
    details: "Posts with a scroll back. The climber is 18 mm. Diamonds are single-cut, with a little more character than a modern brilliant.",
    images: [photo(PHOTOS.drops), photo(PHOTOS.editorial)],
    isNew: true,
    collections: ["new-season", "signature-stones"],
    sizes: ["One size"],
    colors: [gold],
  }),
];

export function catalogSku(slug: string, color: string, size: string) {
  const clean = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "")
      .toUpperCase();
  return `AUV-${clean(slug).slice(0, 14)}-${clean(color).slice(0, 4)}-${clean(size).slice(0, 6)}`;
}
