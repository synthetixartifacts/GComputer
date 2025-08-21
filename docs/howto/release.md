# Release Guide - Building Distributable Executables

This guide covers how to build and package GComputer for distribution as portable executable files for Windows (.exe) and macOS (.dmg).

## Prerequisites

- Node.js 20 LTS installed
- All project dependencies installed: `npm install`
- Project successfully builds: `npm run build`
- Native modules rebuilt: `npm run rebuild:native`

## Current Setup

GComputer already includes `electron-builder` (v26.0.12) as a dev dependency, which is the industry standard for packaging Electron applications into distributable formats.

## Configuration

### 1. Create electron-builder Configuration

Add the following configuration to `package.json`:

```json
{
  "build": {
    "appId": "com.gcomputer.app",
    "productName": "GComputer",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "packages/db/data",
        "to": "db",
        "filter": ["**/*"]
      }
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ],
      "icon": "assets/icon.icns"
    },
    "win": {
      "target": [
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "assets/icon.ico"
    },
    "linux": {
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        }
      ],
      "icon": "assets/icon.png"
    },
    "fileAssociations": [
      {
        "ext": "gcomp",
        "name": "GComputer Project",
        "description": "GComputer Project File"
      }
    ]
  }
}
```

### 2. Add Build Scripts

Add these scripts to the `scripts` section in `package.json`:

```json
{
  "scripts": {
    "build:all": "npm run build && npm run package:all",
    "build:win": "npm run build && npm run package:win",
    "build:mac": "npm run build && npm run package:mac",
    "build:linux": "npm run build && npm run package:linux",
    "package:all": "electron-builder --publish=never",
    "package:win": "electron-builder --win --publish=never",
    "package:mac": "electron-builder --mac --publish=never",
    "package:linux": "electron-builder --linux --publish=never"
  }
}
```

## Building Releases

### Clean Build Commands (Recommended)

To ensure fresh builds without cached artifacts, use the clean build commands:

```bash
# Clean build for Windows
npm run clean:build:win

# Clean build for all platforms  
npm run clean:build:all

# Just clean artifacts (no build)
npm run clean
```

These commands automatically:
1. Remove all build artifacts (`dist/`, `release/`, `node_modules/.cache`)
2. Rebuild everything from scratch
3. Package the executables

### Standard Build Commands

If you're confident there are no cache issues:

### Windows Executable (.exe)

```bash
# Build for Windows (creates portable .exe)
npm run build:win
```

Output: `release/GComputer-1.0.0.exe` (portable executable)

### macOS Application (.dmg)

```bash
# Build for macOS (creates .dmg installer)
npm run build:mac
```

Output: `release/GComputer-1.0.0.dmg` (disk image installer)

### Linux Application (.AppImage)

```bash
# Build for Linux (creates portable AppImage)
npm run build:linux
```

Output: `release/GComputer-1.0.0.AppImage` (portable executable)

### Build All Platforms

```bash
# Build for all supported platforms
npm run build:all
```

### When to Use Clean Builds

Always use clean builds when:
- Creating production releases
- After updating translation files or assets
- When encountering stale code in packaged executables
- Before distributing to users
- After significant code changes

## Release Folder Structure

After building, the `release/` folder will contain:

```
release/
├── GComputer-1.0.0.exe              # Windows portable executable
├── GComputer-1.0.0.dmg              # macOS disk image
├── GComputer-1.0.0.AppImage         # Linux portable executable
├── win-unpacked/                    # Windows unpacked files (for debugging)
├── mac/                             # macOS app bundle (for debugging)
├── linux-unpacked/                  # Linux unpacked files (for debugging)
└── builder-effective-config.yaml    # Build configuration used
```

## Icon Requirements

Create application icons in the `assets/` directory:

- **Windows**: `assets/icon.ico` (256x256, .ico format)
- **macOS**: `assets/icon.icns` (1024x1024, .icns format)  
- **Linux**: `assets/icon.png` (512x512, .png format)

### Creating Icons

From a high-resolution PNG (1024x1024):

```bash
# Install icon generation tools
npm install -g electron-icon-maker

# Generate all icon formats
electron-icon-maker --input=source-icon.png --output=assets
```

## Version Management

The version number in output files comes from `package.json`. To update:

```bash
# Update version and build
npm version patch  # 1.0.0 → 1.0.1
npm run build:all

# Or manually edit package.json version field
```

## Database Handling

The SQLite database (`packages/db/data/gcomputer.db`) is automatically included in the build through the `extraResources` configuration. The app will:

1. Copy the database to the user's app data directory on first run
2. Use the local copy for all operations
3. Preserve user data across app updates

## Troubleshooting

### Cross-Platform Compatibility

The app uses sql.js (pure JavaScript SQLite) which eliminates native compilation issues across Windows, macOS, and Linux platforms. No native module rebuilding is required.

### Build Errors

1. **Missing files**: Ensure `npm run build` completes successfully
2. **Permission errors**: Run terminal as administrator (Windows) or use `sudo` (macOS/Linux)
3. **Icon errors**: Verify icon files exist and are in correct formats

### Platform-Specific Builds

- **Windows**: Can be built on any platform
- **macOS**: Must be built on macOS for code signing
- **Linux**: Can be built on any platform

## Code Signing (Optional)

For production releases, consider code signing:

### Windows
```json
"win": {
  "certificateFile": "certs/cert.p12",
  "certificatePassword": "password"
}
```

### macOS
```json
"mac": {
  "identity": "Developer ID Application: Your Name"
}
```

## Distribution

### Direct Distribution
- Upload files from `release/` folder to your website/CDN
- Users download and run the appropriate file for their platform

### Auto-Updates (Advanced)
Configure electron-builder with update servers for automatic updates:

```json
"publish": {
  "provider": "github",
  "owner": "your-username",
  "repo": "gcomputer"
}
```

## File Naming Convention

Built files follow the pattern: `GComputer-{version}.{ext}`

Examples:
- `GComputer-1.0.0.exe`
- `GComputer-1.2.3.dmg`
- `GComputer-2.0.0.AppImage`

The version is automatically extracted from `package.json`.