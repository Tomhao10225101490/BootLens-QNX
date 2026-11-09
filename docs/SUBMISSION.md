# BootLens

## Inspiration
QNX image configuration joins several different concerns in one text file: which OS starts, which programs enter the image, and which commands run after startup. A small ordering mistake or missing declaration can be difficult to spot before a developer reaches the licensed build environment or target board. We wanted a local, reviewable preflight that makes those relationships visible earlier.

## What it does
BootLens is a working host-side tool for QNX SDP 8.0 mkifs buildfiles. Its browser workbench and Node CLI share one analyzer. It identifies bootstrap placement and executable-order mistakes, duplicate explicit image paths, undeclared startup commands and foreground resource managers that need review. It distinguishes QNX startup builtins from external executables, follows supplied relative includes, and exposes missing inputs as partial coverage.

The workbench lets a reviewer edit source, jump to findings, inspect the startup sequence and image manifest, pin a baseline, compare revisions, and export JSON or SARIF. The CLI provides explicit CI exit codes and bounded local file access. Buildfiles are never executed or uploaded to a server.

## How we built it
A dependency-free JavaScript parser separates top-level attributes and declarations from inline bootstrap, startup-script and data bodies. It preserves source filenames and one-based locations. Global attributes flow across includes; local attributes apply to a single entry. A QNX-specific rule layer checks virtual bootstrap structure, startup/procnto order, internal command handling and image declarations. The same functions drive browser results, CLI output, revision comparisons and SARIF.

Technical semantics were checked against QNX's official SDP 8.0 mkifs, buildfile syntax, bootstrap and startup-script references. The repository documents rule assumptions and validation boundaries. The demo uses original authored broken/reviewed fixtures rather than proprietary BSP files or fake target footage.

## Challenges
The difficult part is knowing what a static analyzer cannot know. A command absent from the explicit manifest may come from a filesystem mounted earlier, and a missing runtime linker may be intentional for a static application. Those are warnings or notes, not definitive build failures. Unresolved variables, missing includes and external script bodies remain visible analysis boundaries. A clean scan never claims that the target will boot.

## Accomplishments
A complete editable workbench and CLI, one shared engine, source-level diagnostics, include-cycle handling, explicit coverage status, startup/manifest inspection, baseline comparisons and portable report formats. Seventeen automated tests cover parser and rule behavior, QNX-specific semantics, SARIF locations and real CLI exit statuses.

## What we learned
Useful preflight tooling needs both actionable explanations and restraint. Showing the exact declaration and its source location is more valuable than a vague pass/fail badge. QNX-specific rules are useful only when their assumptions stay visible.

## What's next
Test against a broader corpus with licensed mkifs, model environment variables and SDK search roots explicitly, add ELF dependency inspection, and measure false positives with QNX developers. No production accuracy, time-savings or safety claim is made.

## QNX use and reproducibility
Category: Developer Tooling & Host Tools. BootLens runs on the host and specifically analyzes QNX SDP 8.0 mkifs configuration, as allowed by the host-tool category. The QNX connection is in dist/analyzer.js, the diagnostic fixtures, source-linked rules and actual JSON/SARIF outputs. Run npm test, then node cli.mjs examples/broken.build; run npm run dev to open the same engine in the workbench. Node 20+ is the host runtime. No QNX SDK, mkifs execution, IFS build, emulator boot or hardware execution is claimed; this project does not include a target executable. QNX toolchain and board testing remain necessary to validate an OS image.

## AI disclosure
Created in November 2026 with OpenAI Codex assistance for research, design, implementation, testing and presentation. The application itself does not call an AI model. Demo frames show actual host software with authored fixtures; synthetic narration is labeled. Prior hackathon project code and assets were not reused. Original source is MIT licensed.
