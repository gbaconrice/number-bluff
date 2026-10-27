NORMAL SKY V2: only normal 1 / 4 / 20; local prototype, not production.
Replaces rejected near-invisible high-peak dimming experiment for evaluation only.
This extends the existing React Bits-derived special image-displacement module;
normal spatial breeze + illumination fields and per-art masks are custom additions,
not falsely presented as verbatim React Bits code. Full upstream notice retained.

Original PNGs are immutable and referenced from sibling soft-card-rebuild directory.
Shared one WebGL context/canvas supports all 4 original special kinds and 3 normal
sky kinds. Do NOT instantiate this alongside a separate special manager in game:
if approved use one shared manager for both. Switching hosts stops prior animation.
One CPU Canvas2D staging surface prefilters original to actual render size once per
size/kind to prevent NPOT minification glitter. No additional WebGL context.

Normal masks: sky y .055..33 (1), .055..37 (4), .055..36 (20), x .065..935.
Feather bottom .04 and lateral .03 normalized units, so no hard rectangular seam.
Card4 right x>=.62,y>=.27 zero; card20 moon x>=.73,y>=.31 zero. These exclusions
start fading earlier. Character and contact silhouettes cannot move.
Numeral is DOM z4 and remains fixed; sky UNDER it may move (previous overconstraint
removed). Prototype uses per-source aspect ratios and dark navy numeral unchanged.

Sky image coordinates move at most 1.4 CSS px horizontally / .65px vertically,
modulated by smooth wind field, finite8s envelope and boundary mask. Existing texture
only; no new line/dot/particle; no whole-card/character transform. Broad illumination
is max +/-2.8%, not global dimming. Source pixels outside mask remain original DOM
because overlay alpha is 0 there. Endpoints0/1 fully transparent.
Visible feather region can blend displaced and original samples; at <=1.4px motion
this is intended to hide seams, but visual double-image review remains mandatory.
Do not increase displacement to compensate for poor small-card quality.

API const fx=NumberBluffCardSurfaceMotion.create({sources:{normal1:URL,normal4:URL,
normal20:URL,extra:URL,double:URL,max0:URL,reset:URL}}); await fx.ready;
fx.play(card,'normal4'); fx.renderAt(card,'normal4',.5); fx.stop(); fx.destroy();
Normal runs8sec, specials default1200ms. Hidden/offscreen/reduced/contextlost/slow
fallback preserved. No recurring auto-loop in prototype.

Tests prepared: test-normal-flow.cjs. The CI test starts a repository-local HTTP server; optional
PROTOTYPE_URL / CHROMIUM_PATH if needed. 3x2sizesx5phases PNGs + masks + numeralDOM
independent verification + switch normal/special samecanvas. Node syntax passed.
Local browser was blocked by environment; no visual pass claimed. Submit QA before
adoption. If minification makes gentle motion unreadable at80px, report that rather
than boosting it into rubbery distortion or new graphic overlays.
