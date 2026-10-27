# Component motion preview (draft)

This preview integrates Uiverse's card flip and Vengeance UI's narrow gold rim, NumberFlow 0.6.2 and canvas-confetti 1.9.4.

- Original card image bytes and approved reveal ordering are unchanged. Artwork itself is not animated by these modules.
- Diagonal glare is removed from all cards. Normal artwork stays still: no floating characters or sky-texture flow. Special cards use source-image optical layers in the identical source-pixel box: feathered luminance selections move reflection, shallow local shade and specular detail over the painted motifs. Visible pixels come from the original, not vector outlines. Original card images never rotate, deform or change bytes; no independent ornaments are added; finite result/detail emphasis is separate from ambient visibility. Hidden, offscreen and closed-dialog faces stop, then resume on return (except OS reduced motion). Rejected duplicate-art motion, sweat-like white marks and unrelated orbiting ornaments do not return.
- Special rendering bounds masks/filters to the painted motif, reuses the static region/luminance selection, and replaces a redundant blackened source-image pass with an equivalent masked shade. Animation timing and original textures remain unchanged. Browser benchmark reports use a desktop CPU-throttled proxy, not an iOS performance guarantee.
- Flip begins only when the presenter authorizes that card's reveal. Skip, rerender and page hiding settle the real face.
- The subtotal displays only authorized presenter values, never interpolated game arithmetic. Victory particles occur once for a confirmed local winner; reconnect does not replay them.
- Existing background scene/cloud movement is retained. A separate component-derived optical-star/meteor overlay refines the TOP effect; its source adaptations and complete licenses are in THIRD_PARTY_NOTICES.top-motion.txt.
- All card containers use a common 2:3 paper shape, with matched image surfaces: original upper frame and lower illustration retain their aspect ratio, while only the empty numeral backdrop band absorbs the source-ratio difference. The eleven soft normal originals and four original special images are preserved.
- The WebGL surface renderer, normal-flow loops and obsolete comparison prototypes are removed. special-effects-controller.js orchestrates only disclosed special-card effects; hidden/reduced-motion states stop them.
- Guide diagrams explain visibility, increasing declarations, challenge uncertainty, both outcome branches and life loss instead of displaying unrelated BOT mascots.
- Runtime integration and actual browser evidence still require review; document text does not certify deployment or live GRAVITY behavior.
- Full licenses remain in component JS/CSS and the single HTML, with separate THIRD_PARTY_NOTICES files.

Scene bundle reproducibility: `cd tools/scene-motion && npm ci && node build.mjs`. Copy the generated component-scene-motion.js to the repository root only after verifying BUILD_MANIFEST and tests. The source adapter is under this directory; no runtime CDN or npm install is required by the shipped game.

Browser evidence must be reviewed for quality. Unit passes do not prove attractive motion, iOS/GRAVITY compatibility or real network behavior.
