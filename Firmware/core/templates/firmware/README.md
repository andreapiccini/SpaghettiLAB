# Firmware file templates

[← Implementation guide](../../FIRMWARE_IMPLEMENTATION_GUIDE.md)

These files are starting points, not additional firmware components. Files use
the neutral name `example`; replace it consistently with the component name.

## Create a component

1. Copy `public_api.h.template` to `include/spaghetti/<component>.h` only if
   another component needs the API.
2. Copy `component.c.template` to `subsys/<component>/<component>.c`.
3. Copy `private_header.h.template` only when sibling `.c` files need shared
   private types or helper declarations. Keep Doxygen and mutable storage out of
   this header.
4. Copy `CMakeLists.txt.template` and, when needed, `Kconfig.template` into the
   component directory.
5. Copy `thread_component.c.template` only if the component meets the dedicated
   thread criteria in the implementation guide.
6. Copy `test_component.c.template` into the component's test source directory.
7. Replace `example`, `EXAMPLE`, types, errors, and comments with the real
   contract. Delete unused sections.
8. Replace `<PROJECT-LICENSE-ID>` only after the project license has been
   selected. Do not assume Apache-2.0 merely because Zephyr uses it.
9. Add the component directory to the parent CMake/Kconfig files.
10. Build and test the configuration in which the component is enabled.

## Templates

| File | Purpose |
|---|---|
| [`change_contract.md.template`](change_contract.md.template) | Decisions to complete before coding |
| [`public_api.h.template`](public_api.h.template) | Public API and Doxygen contract |
| [`private_header.h.template`](private_header.h.template) | Types/helpers shared only by sibling `.c` files |
| [`component.c.template`](component.c.template) | Private state and synchronous implementation |
| [`thread_component.c.template`](thread_component.c.template) | Bounded dedicated worker thread |
| [`CMakeLists.txt.template`](CMakeLists.txt.template) | Component source selection |
| [`Kconfig.template`](Kconfig.template) | Feature, limits, thread resources, and log level |
| [`test_component.c.template`](test_component.c.template) | Basic ztest structure |

Do not compile the templates directly. They intentionally contain names and
policy choices that must be adapted to the task.
