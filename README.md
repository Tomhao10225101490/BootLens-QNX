# BootLens

**Inspect before you build.** A host-side preflight tool for QNX SDP 8.0 `mkifs` buildfiles, with a local browser workbench and a dependency-free Node CLI.

BootLens targets **QNX Global Hackathon / Developer Tooling & Host Tools**. It analyzes QNX-specific virtual bootstraps, image entries, inline startup scripts, internal commands and modifier scope. It is not a generic checklist relabeled for QNX.

## Try it

Public workbench: https://tomhao10225101490.github.io/BootLens-QNX/

Source: https://github.com/Tomhao10225101490/BootLens-QNX

## Run

Node 20+ for the CLI and tests. No package installation, QNX SDK, API key or account needed for BootLens itself.

```sh
npm test
node cli.mjs examples/broken.build
node cli.mjs examples/reviewed.build
node cli.mjs examples/broken.build --format sarif --fail-on never > bootlens.sarif
node cli.mjs examples/reviewed.build --baseline examples/broken.build --format json
npm run dev
```

Open http://localhost:8767 for the workbench. Python 3 is used only as a static development server. Any static HTTP host can serve `dist/`. Do not use file://, because ES modules and fixture loading need HTTP.

CLI exit codes: **0** below threshold, **1** findings meet threshold, **2** input or usage error. Default threshold: errors. Use `--fail-on warning` or `--fail-on never` to choose another policy. A zero exit status says nothing about uninspected SDK artifacts or target boot success.

`--workspace DIR` loads companion `.build`, `.bld` and `.inc` files under that directory. It skips symlinks, `.git`, `node_modules` and `.venv`; enforces limits; and never executes file contents. Absolute and variable include paths are not expanded. Files outside the declared workspace are not read. SARIF upload is a separate user-controlled CI operation; this project does not request GitHub security-event write access.

## Review workflow

1. Open the authored “With issues” fixture, or select local buildfiles. The first `.build`/`.bld` becomes the root. Companion files support supplied relative includes.
2. Run preflight. Review structural errors, warnings that require context, and informational notes separately.
3. Jump to a finding's source line. Inspect startup command sequence and explicit image manifest.
4. Pin a baseline, edit the source or load the “Reviewed” fixture, and compare resolved/new diagnostics.
5. Export a freshly computed JSON or SARIF report. Run the CLI with the same buildfile for CI-compatible behavior.
6. Confirm the actual image using licensed QNX `mkifs` and the appropriate target/board tests. These steps remain essential.

## Rules and confidence

| Rule | Meaning |
| --- | --- |
| BL001 | Unclosed attributes or inline file structure |
| BL002 | Missing/circular/unsupported includes, unresolved variables, external script, or analysis limit |
| BL010 | No bootstrap inspected (may intentionally be a nonbootable image) |
| BL011–13 | Bootstrap placement, executable order, or multiple bootfiles |
| BL020 | Duplicate normalized explicit target path |
| BL021 | Startup executable not explicitly declared (could be supplied externally) |
| BL022 | General shell operators in a restricted startup script |
| BL023 | Foreground resource manager needs review |
| BL024 | `/tmp` mapped to `/dev/shmem` caveat |
| BL025 | Expected runtime-linker path not explicitly declared; may be intentional |

Errors describe problems within the supported subset. Warnings are review prompts, not proof of a defect. Notes supply context. Every finding links to the official QNX 8.0 `mkifs` reference and retains a source file and one-based line number. Reports explicitly identify partial coverage. Even “supported-subset” coverage is not full mkifs validation.

The parser handles quoted attribute values, global-versus-local file attributes, relative supplied includes, cycle detection, outside-inline line continuations, inline data isolation, startup modifiers, environment assignment prefixes, and background commands. It respects QNX internal `display_msg`, `procmgr_symlink`, `reopen`, and `waitfor`, with `+external` override.

## Architecture

- `dist/analyzer.js`: shared parser, diagnostics, comparison and SARIF serialization. Runs unchanged in browser and Node.
- `cli.mjs`: bounded local workspace loader, output formats and explicit CI exit thresholds.
- `dist/app.js`: editable browser workbench, finding navigation, sequence/manifest views, baseline snapshots and report exports.
- `examples/`: original authored diagnostic/review fixtures. They are **not board-qualified boot images** and contain no proprietary QNX binaries.
- `tests/`: 17 tests of parser behavior, QNX-specific rules, include scope, SARIF source mapping, comparison and actual CLI exit statuses.

## Validation boundaries

No proprietary SDK was downloaded or redistributed. No `mkifs` run, IFS build, QEMU boot, QNX deployment, hardware test or production safety validation is claimed. This submission is the working **host-side analyzer**, which supports QNX 8.0 configuration review. Its actual host execution is what the demo shows.

BootLens does not evaluate QNX variable syntax, resolve the SDK's host search paths, inspect external bootstrap/script content, expand directory trees, infer automatic shared-object dependencies, parse ELF, or establish executable permissions. It approximates static declaration matching for commands; PATH reachability, symlink resolution, SDK version compatibility and runtime availability require further verification. Inline closing braces must occupy a line by themselves (or a simple same-line literal). Very complex or escaped inline constructs require manual review. It is an early prototype, not a complete implementation of mkifs grammar.

## Technical sources

The implementation is original; technical semantics were checked against these QNX SDP 8.0 primary references:

- [mkifs](https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.utilities/topic/m/mkifs.html)
- [Buildfile syntax](https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.building/topic/buildfiles/buildfile_syntax.html)
- [Bootstrap configuration](https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.building/topic/buildfiles/nto_bootstrap.html)
- [Startup script](https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.building/topic/buildfiles/nto_script.html)

## Next steps

Validate a broader corpus with licensed `mkifs`, add explicit environment/search-root models and ELF dependency inspection, then collect false-positive rates from QNX developers. No accuracy percentage, measured engineering time savings or production user study is claimed.

## AI disclosure and licensing

Created during November 2026 with OpenAI Codex assistance for research, concept, implementation, tests, documentation and demo preparation. This is disclosed so it is not presented as unaided human work. The tool itself makes no AI calls. Demo fixtures are authored examples, not observed production failures. Synthetic narration is labeled. No code or assets from the participant's other hackathon projects are reused, apart from standard development infrastructure and a standard MIT license text. QNX is a third-party trademark; BootLens is independent and not endorsed by QNX. Original source is MIT licensed.
