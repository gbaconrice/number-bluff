NORMAL BACKGROUND ONLY — local comparison prototype, not candidate/app.
All 11 source PNGs visually inspected. No files in soft-card-rebuild were changed.
Mapping and mask limits are explicit in NumberBluffNormalSky.specs.
Only original source high-luminance LOCAL peaks are allowed to vary; no new dots,
stars, particles, rings, movement, flow, character bobbing, scaling or shader.
This is original source-luminance mask adaptation, not copied React Bits code.
Third-party Glare Hover is separate: this is slow sky light, not a surface sweep.

Canvas2D: one shared canvas moved to one selected visible card at a time. No new
WebGL context. Source image sampled once at display resolution/DPR<=1.5; 12fps
8-second finite light breath. Source stars slowly dim and return, max 7.5%; saturated
white highlights cannot be brightened without adding glow, so no artificial bloom.
The shifted/dimmed pixels never change XY coordinates. Alpha zero everywhere outside
the local highlight mask, and where no numeric color change occurs, preserves original
DOM pixels exactly in all protected areas. 0/8-second endpoints fully transparent.
No attempt to add an effect where the original has no suitable high-luminance peak.

Protection based on visual inspection, not blanket 38%:
0: bottom .37; 1/3: .33 (ears); 2/5: .35; 4: .37 with right x>=.62,y>=.27 excluded;
-5/-10/10: .38; 15: .31 (distant star character); 20: .36 with moon-side x>=.73,y>=.31
excluded. All: x<=.065 or >=.935, y<=.055 excluded; number rectangle x .25–.75,
y .07–.30 excluded; soft boundaries. No character/contact edge is in active masks.

API: const fx=NumberBluffNormalSky.create({sources:{'0':'...'},isSpecialActive:()=>specialRunning});
await fx.play(el,'4'); await fx.renderAt(el,'4',2); fx.stop();fx.pause();fx.resume();fx.destroy();
Call pause/stop BEFORE any special play, plus isSpecialActive guard as defense.
A manager controls exactly one canvas; use one manager globally, not one per card.
Do not attach based on hidden own-card number. Only bind disclosed normal card faces.

Pixel checks: test-normal-sky.cjs prepares all11 x80/210px x0/2/4/8sec screenshots,
checks mask-exterior and protected pixel zero changes, stable number bounds and1canvas.
Use shared workspace as local HTTP server root (source PNG directory is sibling).
Set PROTOTYPE_URL if different; CHROMIUM_PATH optional. Node syntax checks passed.
Browser testing NOT executed here due prior environment socket/bwrap launch failure.
No claim of visually verified subtlety/quality before QA. Some small-card effects may
be intentionally absent if no preserved source highlight meets the threshold.
