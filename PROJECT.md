# Project: Hyper Nova Spectrum Demo Production Pipeline

## Architecture
- 3D WebGL / Three.js particle simulation with custom GLSL shaders and hyperspace singularity warp mechanics
- Agentic Studio Demo Production Pipeline: Reconnaissance, Choreography, Playwright Capture, Deterministic Compression, SSIM Validation, Colosseum Scorecard Audit

## Feature Inventory
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | R1 Simulation Reconnaissance & Choreography | Parameter discovery, presets, sliders, warp sequence choreography | M1 | DONE | ORIGINAL_REQUEST.md |
| 2 | R2 Autonomous Browser Capture | Playwright 1920x1080 capture, pointer/camera easing, visual cursor | M1 | DONE | ORIGINAL_REQUEST.md |
| 3 | R3 Deterministic Media Post-Production | MP4, WebP, GIF, Hero generation within size limits, sync to screenshots/ | M2 | DONE | ORIGINAL_REQUEST.md |
| 4 | R4 Deterministic Quality Verification & Scorecard Audit | Validation report (SSIM diversity, duration tolerance), Colosseum Scorecard | M2 | DONE | ORIGINAL_REQUEST.md |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Reconnaissance & Capture Verification | Verify R1 & R2 execution, scripts, and raw recording integrity | none | DONE |
| 2 | Deliverables & Quality Audit | Verify R3 & R4 media deliverables, SSIM report, Colosseum Scorecard | M1 | DONE |

## Code Layout
- `App.tsx`, `components/`: Three.js application source
- `.studio/`: Studio pipeline metadata, scripts, capture logs, validation.json
- `deliverables/`: Primary generated media assets (demo.mp4, demo.webp, demo.gif, hero.webp)
- `screenshots/`: Synced repository media assets
- `Colosseum_Scorecard.md`: Dimensional evaluation scorecard
