# Component motion preview (draft)

This preview integrates React Bits Glare Hover (vanilla port), Uiverse's card flip and Vengeance UI's narrow gold rim, NumberFlow 0.6.2 and canvas-confetti 1.9.4.

- Original card image bytes and approved reveal ordering are unchanged. Artwork itself is not animated by these modules.
- A single shared glare manager permits one finite pass. Normal cards use glare only: no floating characters or sky-texture flow. Special cards may combine glare with a finite SVG effect aligned to the unchanged original image. Rejected duplicate-art motion, sweat-like white marks and unrelated orbiting ornaments do not return.
- Flip begins only when the presenter authorizes that card's reveal. Skip, rerender and page hiding settle the real face.
- The subtotal displays only authorized presenter values, never interpolated game arithmetic. Victory particles occur once for a confirmed local winner; reconnect does not replay them.
- Existing background scene/cloud movement is retained. A separate component-derived optical-star/meteor overlay refines the TOP effect; its source adaptations and complete licenses are in THIRD_PARTY_NOTICES.top-motion.txt.
- All card containers use a common 2:3 paper shape, while each image is contained at its intrinsic aspect ratio without cropping. The eleven soft normal originals and four original special images are preserved.
- The WebGL surface renderer, normal-flow loops and obsolete comparison prototypes are removed. special-effects-controller.js orchestrates only disclosed special-card effects; hidden/reduced-motion states stop them.
- Guide diagrams explain visibility, increasing declarations, challenge uncertainty, both outcome branches and life loss instead of displaying unrelated BOT mascots.
- Runtime integration and actual browser evidence still require review; document text does not certify deployment or live GRAVITY behavior.
- Full licenses remain in component JS/CSS and the single HTML, with separate THIRD_PARTY_NOTICES files.

Scene bundle reproducibility: `cd tools/scene-motion && npm ci && node build.mjs`. Copy the generated component-scene-motion.js to the repository root only after verifying BUILD_MANIFEST and tests. The source adapter is under this directory; no runtime CDN or npm install is required by the shipped game.

Browser evidence must be reviewed for quality. Unit passes do not prove attractive motion, iOS/GRAVITY compatibility or real network behavior.
