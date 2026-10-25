# DuckIt fixed-step input verification, 25 October 2026

PR #2 already bounded the physics clock, but player movement and jump impulses still ran once after each rendered frame. The actual scene and pinned Box2D runtime moved 127.559, 141.971 and 144.378 pixels during one elapsed second at 30, 60 and 120 rendered frames per second, despite executing sixty physics steps in each case.

Player input now applies before every fixed physics step. A per-render input buffer retains a short jump press until a tick can consume it. Held movement and jump state retain their existing behavior; the player's grounding and upward-velocity guards are unchanged.

The actual Phaser scene and bundled Box2D pass twelve combinations of Chromium/Firefox, 390/1280 CSS pixels, and 30/60/120 Hz. All move exactly 144.377735 pixels per elapsed second. Jump apex sampling differs by 0.052 pixels across the render rates and each jump lands again. Forty-eight touch/keyboard cases preserve one successful jump through zero-step render frames and four-step catch-up, without another impulse during the following gap. Thirty-six fast-fall cases at 100, 500 and 2000 metres per second land above the test platform. Every five-second gap executes exactly four steps of 1/60 second with four solver substeps.

Five production-helper regressions, TypeScript and the Vite production build pass. Separate silent checks of the unmodified production artifact open the game and activate its start control in both browsers at both viewports, with no browser exceptions or audio requests. [Detailed source, runtime and artifact hashes](fixed-step-2026-10-25.json).

The source probes expose the game constructor and count calls around the real Box2D solver. They do not stub physics. To repeat them, serve `vite-template` on port 4297, make Playwright 1.61.0 available through `DUCK_PLAYWRIGHT_MODULE`, and run `DUCK_FIREFOX=1 node docs/evidence/tools/verify-fixed-physics.cjs final`. To repeat the production smoke, build and serve the artifact on port 4298, then run `node docs/evidence/tools/verify-production.cjs` with the same Playwright module setting. Both tools install audio guards before navigation.

Physical mobile timing remains unverified. These desktop browser checks do not establish representative device step-duration comparisons or a performance gain. This delivery does not merge the PR or publish a hosted game.
