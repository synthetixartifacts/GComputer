### Install Guide (macOS + Windows)

This project uses Electron + Svelte + Vite + Tailwind + SCSS with TypeScript.

Recommended versions: Node.js 22 LTS, npm 10+, Git.

---

### macOS

- Install Homebrew (optional):
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```
- Install Node 22 and Git (choose one):
  - Homebrew:
    ```bash
    brew install node@22 git
    ```
  - Or download from [Node.js](https://nodejs.org) and [Git](https://git-scm.com/download/mac).
- Xcode Command Line Tools (for native deps):
  ```bash
  xcode-select --install || true
  ```
- Clone repo and install deps:
  ```bash
  git clone https://github.com/your-org/GComputer.git
  cd GComputer
  npm ci
  ```

### Drizzle CLI (optional)

Drizzle Studio and codegen are available via workspace scripts; no global install needed.

From repo root you can run:
```bash
# Launch Drizzle Studio UI
npm --workspace @gcomputer/db run drizzle:studio

# Generate migrations after editing schema.ts
npm --workspace @gcomputer/db run drizzle:generate
```

---

### Windows

- Install Node 22 LTS and Git:
  - Using winget:
    ```powershell
    winget install -e --id OpenJS.NodeJS.LTS
    winget install -e --id Git.Git
    ```
  - Or download from [Node.js](https://nodejs.org) and [Git](https://git-scm.com/download/win).
- (If native build tools are needed) Visual Studio Build Tools:
  ```powershell
  winget install -e --id Microsoft.VisualStudio.2022.BuildTools
  ```
- Clone repo and install deps:
  ```powershell
  git clone https://github.com/your-org/GComputer.git
  cd GComputer
  npm ci
  ```

---

### Verify

```bash
node -v   # v22.x
npm -v    # 10+
npm run typecheck
```

If you see a Vite error mentioning "crypto.hash is not a function", update Node to 22 LTS.


