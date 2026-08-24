# Repository naming conventions

SpaghettiLAB Community uses predictable, cross-platform names.

## Directories

- Use lowercase `kebab-case` for project-owned directories.
- Top-level directories are `hardware`, `firmware`, `software`, `examples`, and
  `docs`.
- Hardware project directories and their KiCad project basenames must match.
- Avoid repeated generic nesting such as `module/module/module`.

## Files

- Use lowercase `kebab-case` for project documents and hardware project files.
- Use the language convention for source files: `snake_case` for C and Python,
  and `kebab-case` for TypeScript modules where the existing package convention
  requires it.
- Preserve conventional or tool-required names such as `README.md`, `LICENSE`,
  `NOTICE`, `CMakeLists.txt`, `Dockerfile`, Apple `Runner` projects, and stable
  roadmap identifiers.

## KiCad

A KiCad project directory and its primary files share one lowercase basename:

```text
hardware/backbone/backbone.kicad_pro
hardware/backbone/backbone.kicad_sch
hardware/backbone/backbone.kicad_pcb
```

When changing a basename, update the project metadata and every schematic or
board reference in the same commit, then run KiCad ERC and DRC before merging.
