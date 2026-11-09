# Codelab: preflight a QNX 8.0 image buildfile before the target test

Author: Hao Zhong, with OpenAI Codex assistance, November 2026.

**Outcome:** inspect an authored QNX SDP 8.0 `mkifs` buildfile, explain eight diagnostics, review a revised manifest, and create a SARIF report suitable for a CI workflow. This is a host-side configuration task for QNX, not a claim that the example boots.

**Time:** approximately 15–25 minutes. **Prerequisites:** Node 20+, a shell on macOS/Linux/Windows, and this public repository. The browser workbench can perform the review without Node. No proprietary QNX SDK files are included. Final build and target validation require a suitable licensed QNX environment and BSP.

## 1. Obtain and verify the host tool

```sh
git clone https://github.com/Tomhao10225101490/BootLens-QNX.git
cd BootLens-QNX
npm test
node cli.mjs --help
```

The tests should finish with 17 passed, 0 failed. They exercise authored fixtures and the host software; they do not test a QNX target. If tests fail, stop and inspect the runtime/version before trusting subsequent outputs.

## 2. Inspect the issue fixture

```sh
node cli.mjs examples/broken.build
```

The nonzero exit code is expected. There are three errors, four warnings and one note. Open the fixture beside the report and check each cited line.

- BL011: an ordinary file appears before the virtual bootfile. For a bootable image, QNX requires the bootfile to be the first file specification.
- BL012: the authored bootstrap puts the process manager before startup. A QNX bootstrap's first executable must be an appropriate startup program, and its last must be the process manager.
- BL020: two source files map to the same explicit target `/usr/bin/observer`. Decide which source is intended rather than silently accepting both.
- BL021: the script starts programs that the explicit manifest does not declare. This may be legitimate if a filesystem mounted earlier supplies them, so review the actual runtime path rather than treating the warning as a proven build failure.
- BL023: a foreground resource manager may prevent later script commands from running if it never exits. Check whether the process should start in the background and whether readiness needs synchronization.
- BL024: mapping `/tmp` to `/dev/shmem` is not a full temporary-filesystem solution. Review an appropriate filesystem for a deployed system.
- BL025: the expected runtime-linker path is not explicitly supplied. Static programs or an external filesystem may make this intentional; confirm dynamic dependencies with the real artifacts.

Do not repair a real BSP by blindly copying this fixture. Startup programs, arguments, image offsets, drivers, devices and file paths must match the target and QNX version.

## 3. Review the revised fixture

```sh
node cli.mjs examples/reviewed.build
```

This fixture moves the bootfile first and corrects the startup/process-manager order. It keeps one observer target, starts the console manager in the background, declares the script executables and includes an explicit runtime-linker target. It removes the demonstration `/tmp` link rather than claiming to provide a production temporary filesystem.

The result has zero findings **in BootLens's supported subset**. It is still not a bootable-image certificate: the named host binaries have not been located, inspected, or built into an IFS, and no emulator or board has run them.

Inspect the QNX-specific differences in `examples/`. Keep all decisions traceable to the actual buildfile and official QNX documentation.

## 4. Compare changes rather than counts alone

```sh
node cli.mjs examples/reviewed.build \
  --baseline examples/broken.build --format json
```

Inspect `comparison.resolved` and `comparison.introduced`. The authored revision resolves eight findings and introduces none. A finding fingerprint uses its rule, source file and message; moving the same statement to another line is not by itself considered a new issue.

For the browser workflow, serve `dist/` with `npm run dev`, open http://localhost:8767, load “With issues,” choose Compare revisions and pin the scan, then load “Reviewed.” Inspect source findings, Startup sequence and Image manifest. All parsing is local to the browser.

## 5. Export a report with an explicit CI policy

```sh
node cli.mjs examples/broken.build --format sarif --fail-on never > bootlens.sarif
node cli.mjs examples/reviewed.build --fail-on warning
```

`--fail-on never` is a report-generation policy, not a way to remove findings: the SARIF still contains them. Use `--fail-on warning` when a pipeline should require review of both warnings and errors. The default fails only on errors. Input and usage failures exit 2, independently of the finding threshold.

A minimal CI check can run:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
- run: npm test
- run: node cli.mjs path/to/board.build --workspace path/to --fail-on warning
```

SARIF publication requires separate repository permissions. BootLens does not automatically upload reports or request security-event write access. Review buildfile contents and paths before sharing reports externally.

## 6. Carry out the real QNX validation separately

Use the actual target BSP and installed QNX SDP 8.0 toolchain on a supported development host. QNX documents `mkifs` as running on Linux and Windows; BootLens's macOS support does not imply that the QNX SDK runs on macOS. Follow the BSP instructions and source the appropriate licensed development environment.

For an appropriately prepared, target-specific buildfile, QNX documents this basic invocation:

```sh
mkifs board.build board.ifs
```

This command is shown as the next validation step, **not an action performed in this codelab's evidence**. Check the SDK's source search paths, licenses, architecture, libraries, permissions and target-specific settings; inspect the produced image and perform the appropriate emulator/board boot tests. Do not use an unvalidated prototype for a safety-critical deployment.

## Troubleshooting and boundaries

- **Partial coverage:** supply relative include files under `--workspace`, or manually inspect external/variable includes. Circular includes remain visible errors.
- **Different command availability:** the tool matches explicit declarations, not runtime PATH reachability or every union-filesystem/symlink behavior.
- **Clean scan, failing build:** the complete `mkifs` grammar, variable expansion, SDK search paths, directory expansion and ELF dependency closure are outside this prototype.
- **Host input error:** check the path, Node version, workspace boundary and file limits. The CLI does not follow workspace symlinks.

## References and evidence

- [QNX SDP 8.0 mkifs reference](https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.utilities/topic/m/mkifs.html)
- [Buildfile syntax](https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.building/topic/buildfiles/buildfile_syntax.html)
- [Bootstrap configuration](https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.building/topic/buildfiles/nto_bootstrap.html)
- [Startup scripts](https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.building/topic/buildfiles/nto_script.html)

Actual host-run outputs are retained in `docs/evidence/`. Code, tests, diagnostic fixtures and explanations were created with Codex assistance and disclosed. No QNX SDK invocation, IFS output, target boot, production incident, user study or measured time saving is fabricated.
