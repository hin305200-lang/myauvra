import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { Photo } from "@/components/product/photo";
import { PHOTOS, photo } from "@/lib/photos";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "The atelier" };

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <>
      <section className="hero" style={{ minHeight: "78svh" }}>
        <div className="hero-media"><Photo src={photo(PHOTOS.editorial, 2000)} alt="A gold necklace photographed in afternoon light" priority sizes="100vw" /></div>
        <div className="hero-copy">
          <p className="eyebrow" style={{ color: "#f3e6cf" }}>{settings.brandName}</p>
          <h1 className="display">Jewelry with a quiet voice.</h1>
          <p>Auvra is a house for pieces that sit close to the body. We design less, finish more, and leave the gold looking like it belongs to the person wearing it.</p>
        </div>
      </section>
      <Reveal>
        <section className="section split">
          <div className="copy">
            <p className="eyebrow">Philosophy</p>
            <h2 className="serif" style={{ fontSize: "clamp(2.4rem, 4vw, 3.6rem)", fontWeight: 500 }}>Restraint is the luxury.</h2>
            <p>We start from the line of a hand, a collarbone, a wrist. Stones are chosen for character rather than size. Settings stay low. Clasps are meant to be forgotten once they are fastened.</p>
            <p>Nothing here is produced to fill a season. A piece stays in the collection when it still feels right a year later.</p>
          </div>
          <div className="visual"><Photo src={photo(PHOTOS.goldHand)} alt="A hand wearing a gold ring" sizes="50vw" /></div>
        </section>
      </Reveal>
      <Reveal>
        <section className="section split">
          <div className="visual"><Photo src={photo(PHOTOS.tray)} alt="Jewelry tools and a gold setting on the bench" sizes="50vw" /></div>
          <div className="copy">
            <p className="eyebrow">Craft</p>
            <h2 className="serif" style={{ fontSize: "clamp(2.4rem, 4vw, 3.6rem)", fontWeight: 500 }}>Modeled, cast, and set by hand.</h2>
            <p>Each piece is modeled, cast in recycled 18k gold or platinum, and finished at the bench. Prongs are shaped for the stone they hold. Edges are softened until the metal feels warm, not sharp.</p>
            <p>We keep editions small so the person who finishes a ring can still recognize it.</p>
          </div>
        </section>
      </Reveal>
      <Reveal>
        <section className="section">
          <p className="eyebrow">Materials</p>
          <h2 className="serif" style={{ fontSize: "clamp(2.4rem, 4vw, 3.6rem)", fontWeight: 500 }}>Gold, platinum, and stones with a point of view.</h2>
          <div className="product-grid">
            {[
              ["18k gold", "Yellow and white gold, recycled, with a color that stays close to skin."],
              ["Platinum", "A cooler metal for bands and settings that should disappear around a stone."],
              ["Stones", "Diamonds, sapphires, pearls, emeralds, and onyx, chosen one at a time."],
            ].map(([title, body]) => (
              <article key={title} className="panel">
                <h3 className="serif" style={{ fontSize: "2rem", fontWeight: 500, marginTop: 0 }}>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>
      <Reveal>
        <section className="section split">
          <div className="copy">
            <p className="eyebrow">The house</p>
            <h2 className="serif" style={{ fontSize: "clamp(2.4rem, 4vw, 3.6rem)", fontWeight: 500 }}>A short history.</h2>
            <p>Auvra began as a bench shared by two goldsmiths who were tired of jewelry that announced itself from across a room. The first collection was twelve pieces, sold by appointment. The name stayed. The scale grew only as far as the bench could still finish every piece.</p>
            <p>Today the house keeps that same standard: small numbers, insured delivery, and a member price for people who return.</p>
          </div>
          <div className="visual"><Photo src={photo(PHOTOS.portrait)} alt="Editorial portrait with gold jewelry" sizes="50vw" /></div>
        </section>
      </Reveal>
    </>
  );
}
