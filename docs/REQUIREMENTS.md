# QNX Global Hackathon — verified requirements

Research date: 2026-11-09 (Asia/Shanghai).

Official event: https://qnx.devpost.com/
Official rules: https://qnx.devpost.com/rules

- Fully online Devpost entry and judging materials. No in-person presentation or collection requirement found.
- Cash prizes total USD 50,000. Developer Tooling & Host Tools category: USD 4,000 winner and USD 2,000 runner-up; other applicable prizes subject to rules.
- Rules section 8(3): cash may be mailed or electronically sent to the winner's bank account after verification and required forms. No prize is guaranteed; qualifying, winning, and completed forms are required.
- Adults 18+; China is not named in the listed excluded territories. Other residency, conflict-of-interest and legal restrictions still apply.
- Deadline December 15, 2026 14:00 EST = December 16, 2026 03:00 Asia/Shanghai.
- Host tools on macOS, Linux or Windows that analyze/build/test/support QNX 8.0 software explicitly qualify. Demonstrate a meaningful QNX-specific function, not a generic tool relabeled in README.
- Public open-source repo with license; English instructions and description; public YouTube demo under three minutes showing functioning software.
- New work or significant updates during Nov 2–Dec 15. Code and attribution must be truthful.
- Registration/legal agreements and any CAPTCHA require confirmation at the actual step. Banking/tax identity verification remains user-controlled.

## Selected concept

BootLens: a host-side preflight analyzer for QNX SDP 8.0 mkifs buildfiles. Parse image files, bootstrap and startup scripts; show line-specific diagnostics, command dependencies, image entries, unsupported constructs and confidence boundaries. Export JSON and SARIF for CI. Do not claim to replace mkifs or to boot a QNX image without evidence.

## Technical primary sources

- https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.utilities/topic/m/mkifs.html
- https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.building/topic/buildfiles/buildfile_syntax.html
- https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.building/topic/buildfiles/nto_bootstrap.html
- https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.building/topic/buildfiles/nto_script.html

No proprietary QNX SDK binaries, licenses or third-party code copied into this repository.
