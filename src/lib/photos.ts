export function photo(id: string, width = 1600) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

export const PHOTOS = {
  flatlay: "photo-1515562141207-7a88fb7ce338",
  diamond: "photo-1605100804763-247f67b3557e",
  ringMacro: "photo-1603561591411-07134e71a2a9",
  necklace: "photo-1599643478518-a784e5dc4c8f",
  goldHand: "photo-1611591437281-460bfbe1220a",
  earrings: "photo-1535632066927-ab7c9ab60908",
  bracelet: "photo-1573408301185-9146fe634ad0",
  portrait: "photo-1611652022419-a9419f74343d",
  goldStill: "photo-1601121141461-9d6647bca1ed",
  bangle: "photo-1588444837495-c6cfeb53f32d",
  pearls: "photo-1599643477877-530eb83abc8e",
  pearlHand: "photo-1589674781759-c21c37956a44",
  chain: "photo-1619119069152-a2b331eb392a",
  ringBox: "photo-1512163143273-bde0e3cc7407",
  handRing: "photo-1608042314453-ae338d80c427",
  editorial: "photo-1506630448388-4e683c67ddb0",
  bands: "photo-1617038260897-41a1f14a8ca0",
  drops: "photo-1630019852942-f89202989a59",
  tray: "photo-1622398925373-3f91b1e275f5",
  pendant: "photo-1589128777073-263566ae5e4d",
  sparkle: "photo-1602173574767-37ac01994b2a",
  stones: "photo-1596944924616-7b38e7cfac36",
  stack: "photo-1617038220319-276d3cfab638",
  solitaire: "photo-1608043152269-423dbba4e7e1",
  emerald: "photo-1635767798638-3e25273a8236",
} as const;
