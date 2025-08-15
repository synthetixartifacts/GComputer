# Project Installation Guide

This project uses Electron + Svelte + Vite + Tailwind + SCSS with TypeScript.

**Required versions:**
- Node.js 20 LTS (which includes npm 10.x)

---

## Quick Start

If you already have Node.js 20 LTS and the project code:

```bash
# 1. Navigate to project directory
cd GComputer

# 2. Install dependencies
npm install

# 3. Rebuild native dependencies
npm run rebuild:native

# 4. Verify and run
npm run typecheck
npm run dev
```

---

## Prerequisites Check

Before starting, verify your system has the required tools:

```bash
node --version    # Should be v20.x.x or higher
npm --version     # Should be 10.x.x or higher  
```

If any command fails or shows an older version, follow the installation steps below for your platform.

---

## Installing Node.js 20 LTS

### macOS

**Option A: Using Homebrew (Recommended)**

1. Install Homebrew if you don't have it:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install Node.js 20 LTS:
   ```bash
   brew install node@20
   ```

3. Make Node.js 20 your default version:
   ```bash
   brew link node@20 --force --overwrite
   ```

4. Install Xcode Command Line Tools (for native dependencies):
   ```bash
   xcode-select --install
   ```

**Option B: Using Official Installers**

1. Download and install Node.js 20 LTS from [nodejs.org](https://nodejs.org/)
2. Install Xcode Command Line Tools: `xcode-select --install`

### Windows (with WSL2/Ubuntu)

*Assuming you already have WSL2 with Ubuntu set up.*

1. **Update Ubuntu system**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl build-essential
   ```

2. **Install Node.js 20 LTS using NodeSource**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```



### Windows (Native PowerShell)

1. **Using winget**:
   ```powershell
   winget install -e --id OpenJS.NodeJS.LTS
   ```

2. **Using Chocolatey** (if you have it):
   ```powershell
   choco install nodejs-lts
   ```

3. **Using Official Installers**:
   - Download Node.js 20 LTS from [nodejs.org](https://nodejs.org/)

### Universal: Using Node Version Manager (nvm)

If you prefer to manage multiple Node.js versions:

**macOS/Linux/WSL2:**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Restart terminal or reload shell
source ~/.bashrc

# Install Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20
```

**Windows (native):**
- Download nvm-windows from [github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows)
- Then: `nvm install 20.0.0` and `nvm use 20.0.0`

---

## Project Setup

Once you have Node.js 20 LTS installed and the project code:

### 1. Verify Installation
```bash
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

### 2. Navigate to Project Directory
```bash
cd GComputer
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Rebuild Native Dependencies
This is required for better-sqlite3 to work properly:
```bash
npm run rebuild:native
```

### 5. Verify Project Setup
```bash
# Check TypeScript compilation
npm run typecheck

# Build the project
npm run build

# Run development server
npm run dev
```

The `npm run dev` command should:
- Start the Vite dev server (port 5173)
- Compile main and preload processes
- Launch the Electron app

---

## Database Tools (Optional)

If you need to work with the database:

```bash
# Launch Drizzle Studio UI
npm --workspace @gcomputer/db run drizzle:studio

# Generate migrations after editing schema.ts
npm --workspace @gcomputer/db run drizzle:generate
```

---

## Troubleshooting

### Common Issues:

**1. "crypto.hash is not a function" error:**
- Update to Node.js 20 LTS
- Clear and reinstall: `rm -rf node_modules package-lock.json && npm install`

**2. Native module build errors:**
- Run `npm run rebuild:native`
- Ensure build tools are installed:
  - macOS: `xcode-select --install`
  - Ubuntu/WSL2: `sudo apt install build-essential`
  - Windows: Install Visual Studio Build Tools

**3. Permission errors (WSL2):**
- Clone projects inside WSL2 filesystem (`/home/$USER/`) not Windows filesystem (`/mnt/c/`)

**4. Port already in use:**
- Kill existing processes: `pkill -f "vite\|electron"`
- Or change the port in vite.config.mts

**5. npm install fails:**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json: `rm -rf node_modules package-lock.json`
- Try again: `npm install`

### Version Requirements Explained:

- **Node.js 20 LTS**: Required for modern JavaScript features and Vite compatibility
- **npm 10.x**: Comes bundled with Node.js 20, provides workspace support

### Getting Help:

If you encounter issues not covered here:
1. Check the console output for specific error messages
2. Ensure all versions match the requirements above
3. Try the troubleshooting steps for your specific error
4. Clear node_modules and reinstall as a last resort