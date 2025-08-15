# Local Files (Features section)

## What it does
- Lets you choose a local folder using the browser file picker (no Node/Electron APIs in the renderer)
- Displays a summary and renders files in list or grid views using existing components

## How to use
1. Navigate to `Development → Features → Local files`
2. Click the Browse button
3. Select a folder (the picker uses `webkitdirectory` to select directories)
4. Toggle between list/grid to preview the items

## Notes & limitations (v1)
- Uses the browser File API; file contents are not read.
- The `webkitdirectory` attribute is non-standard but widely supported in Chromium/Electron.
- The selected file entries include `webkitRelativePath` which we use to infer the root folder name.

## Security model
- Renderer has `nodeIntegration: false` and `contextIsolation: true`.
- No direct filesystem access from the renderer. All future native FS interactions must go through a preload-exposed, whitelisted API.

## Next steps (planned)
- Preload IPC to show native directory dialogs and read directories via Node.
- Persist bookmarked folders in settings.
- Enrich previews for supported media types (thumbnails/metadata).


