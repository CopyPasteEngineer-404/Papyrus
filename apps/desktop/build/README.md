# Build Resources

Place application icons here for electron-builder packaging.

## Required Files

- `icon.ico` — Windows icon (256x256 or larger, .ico format)
- `icon.png` — Linux/PNG icon (512x512, .png format)
- `icon.icns` — macOS icon (512x512 or larger, .icns format)

## Notes

- The quill/feather logo from the intro animation should be used as the app icon.
- For best results, use a dedicated icon design tool or convert from SVG.
- electron-builder will auto-generate missing formats from `icon.png` when possible.
