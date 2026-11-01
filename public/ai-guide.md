# AI Guide — HTML Component Library

This is a static component library. The catalog is at `assets/data/components.json`.

## How to discover components

1. Fetch `assets/data/components.json`.
2. Each entry contains an `id` and a `path` relative to the Pages site root.
3. Fetch `<path>/info.json` for the component name, category, tags, version and file map.
4. Fetch the files listed in `info.json`:
   - `html`: markup fragment
   - `css`: component styles
   - `js`: optional behavior script (`null` means absent)

## Integration rules

- Insert the HTML fragment into the target page.
- Add the CSS to the target stylesheet or a dedicated component stylesheet.
- Include the JavaScript only when `files.js` is not null. Initialize it after the fragment exists in the DOM.
- Keep component class names and IDs unique. Rename IDs if multiple instances are used.
- Check for CSS conflicts with the host page and adapt typography, colors and spacing to the host design.
- Preserve labels, button types, accessible names and keyboard behavior.
- Do not assume external libraries are present. Components in this collection are Vanilla JS-first.
- Review and adapt code before use; do not blindly execute code from an untrusted source.

## Direct URL pattern

`<Pages base URL>/<component path>/<filename>`

Example paths:
- `components/buttons/basic-button/index.html`
- `components/buttons/basic-button/style.css`
- `components/inputs/search-input/script.js`
