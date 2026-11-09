# Verification record

Date: 2026-11-09, Asia/Shanghai.

## Completed

- `npm test`: 17 passed, 0 failed.
- Actual CLI invocation against the authored issue fixture exits 1 (default error threshold).
- The reviewed fixture exits 0, with zero errors, warnings and notes in the supported subset.
- `--fail-on never` exits 0 for report generation without hiding findings.
- Missing file/invalid invocation exits 2.
- JSON baseline comparison reports eight resolved diagnostics and zero introduced findings.
- SARIF export includes rule IDs, correct severities and one-based source locations.
- Text, JSON and SARIF outputs from actual host executions are retained in docs/evidence/.
- Sites deployment returned succeeded; its private URL is not yet a public judge-access link.
- Devpost registration was observed with “Thanks for registering!” and the QNX project-management page.

## Native Chrome verification

- Browser workbench loads the authored issue fixture with 3 errors, 4 warnings and 1 note.
- Clicking image.build:4 selects the exact virtual bootstrap source line.
- Startup view identifies display_msg, waitfor and reopen as QNX internal commands; devc-con and /bin/shell are external.
- Pinning baseline and loading the reviewed fixture produces 8 resolved, 0 introduced and 0 unchanged diagnostics.
- Reviewed manifest has 8 explicit entries and 5 startup commands.
- Browser SARIF download was read from Downloads and parsed as SARIF 2.1.0 with the BootLens driver and zero results for the reviewed fixture.
- Actual browser screenshots retained for the demo. They are host execution, not QNX boot footage.

## Remaining validation

Public repository was freshly cloned and all 17 tests passed. GitHub Pages public index.html, analyzer.js, app.js and style.css were compared against local source by SHA-256. YouTube publication was observed with the public URL https://youtu.be/IP4m4F7rZP8 and no copyright issues. Final Devpost submission was observed with the “Project submitted!” success banner and the project listed under QNX Global Hackathon. Public project: https://devpost.com/software/bootlens . Browser multi-file import and responsive/device-width behavior have not been independently exercised.

## Scope

This is host-side static analysis of authored QNX 8.0 buildfile fixtures. No licensed QNX SDK has been installed or invoked, and no IFS image, emulator boot or hardware execution is claimed. Test success does not validate QNX runtime behavior or production safety.
