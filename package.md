### Packaging (.dmg for macOS, .exe for Windows)

This project uses `electron-builder` for packaging.

---

### Configuration

Add a `build` field in `package.json` (example skeleton):

```jsonc
{
  "build": {
    "appId": "com.yourorg.gcomputer",
    "productName": "GComputer",
    "files": [
      "dist/main/**",
      "dist/preload/**",
      "dist/renderer/**",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "target": ["dmg"],
      "hardenedRuntime": true,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },
    "win": {
      "target": ["nsis"],
      "publisherName": "Your Org"
    },
    "directories": {
      "buildResources": "build"
    }
  }
}
```

Create a `build/` directory with icons and (for mac) `entitlements.mac.plist`.

---

### One-time setup
- Icons: place platform icons in `build/` (e.g., `icon.icns`, `icon.ico`).
- macOS signing (optional for local, required for distribution): setup Apple Developer ID certs and notarization.

---

### Build app, then package installers

1) Build binaries and UI:
```bash
npm run build
```

2) Package installers:
```bash
npx electron-builder --mac dmg   # macOS .dmg
npx electron-builder --win nsis  # Windows .exe (NSIS)
```

Outputs will be in `dist/` and `dist/*.dmg` / `dist/*.exe` (or `dist/your-product-setup.exe`).

---

### CI recommendations
- Use GitHub Actions matrix (macos-latest, windows-latest) to build per platform.
- Cache `~/.npm` and `node_modules` as appropriate.
- Don’t commit built artifacts; publish via Releases.


