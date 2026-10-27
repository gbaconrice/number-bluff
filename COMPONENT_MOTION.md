# Component motion preview (draft)

This preview integrates React Bits Glare Hover (vanilla port), Uiverse's card flip and Vengeance UI's narrow gold rim, NumberFlow 0.6.2 and canvas-confetti 1.9.4.

- Original card image bytes and approved reveal ordering are unchanged. Artwork itself is not animated by these modules.
- A single shared glare manager permits one finite pass. No rejected duplicate artwork/SVG returns.
- Flip begins only when the presenter authorizes that card's reveal. Skip, rerender and page hiding settle the real face.
- The subtotal displays only authorized presenter values, never interpolated game arithmetic. Victory particles occur once for a confirmed local winner; reconnect does not replay them.
- Background/home movement remains unchanged. Soft framed normal originals are selected; in-game visual approval is still required.
- Full licenses remain in component JS/CSS and the single HTML, with separate THIRD_PARTY_NOTICES files.

Scene bundle reproducibility: `cd tools/scene-motion && npm ci && node build.mjs`. Copy the generated component-scene-motion.js to the repository root only after verifying BUILD_MANIFEST and tests. The source adapter is under this directory; no runtime CDN or npm install is required by the shipped game.

Browser evidence must be reviewed for quality. Unit passes do not prove attractive motion, iOS/GRAVITY compatibility or real network behavior.
