"use client";

import { useState } from "react";
import { Photo } from "./photo";
import { Modal } from "@/components/ui/dialog";

export function Gallery({ images, name }: { images: { url: string; alt: string | null }[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = images[index] ?? images[0];
  if (!current) return <div className="gallery-main" />;
  return (
    <div>
      <button className="gallery-main" type="button" onClick={() => setZoom(true)} aria-label="Enlarge photograph">
        <Photo src={current.url} alt={current.alt || name} priority sizes="(min-width: 800px) 50vw, 100vw" />
      </button>
      {images.length > 1 ? (
        <div className="thumbs" style={{ marginTop: "0.6rem" }}>
          {images.map((image, imageIndex) => (
            <button key={image.url + imageIndex} type="button" data-active={imageIndex === index} onClick={() => setIndex(imageIndex)} aria-label={`Photograph ${imageIndex + 1}`}>
              <span style={{ position: "relative", display: "block", width: "100%", height: "100%" }}>
                <Photo src={image.url} alt="" sizes="80px" />
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <Modal open={zoom} onOpenChange={setZoom} title={name} wide>
        <div className="gallery-main" style={{ minHeight: "70svh" }}>
          <Photo src={current.url} alt={current.alt || name} sizes="90vw" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.8rem" }}>
          <button className="btn btn-line" type="button" onClick={() => setIndex((value) => (value - 1 + images.length) % images.length)}>Previous</button>
          <button className="btn btn-line" type="button" onClick={() => setIndex((value) => (value + 1) % images.length)}>Next</button>
        </div>
      </Modal>
    </div>
  );
}
