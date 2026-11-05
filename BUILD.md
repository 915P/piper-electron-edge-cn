# Build and Distribution Guide

This document explains how to build and distribute the Piper TTS Electron application.

## Prerequisites

### Required Tools
- **Node.js** (v18 or later)
- **npm** (v8 or later)
- **Git**

### Platform-Specific Requirements

#### macOS
- **Xcode Command Line Tools**: `xcode-select --install`
- **For code signing** (optional): Apple Developer account and certificates

#### Windows
- **Windows SDK** (for building native modules)
- **For code signing** (optional): Code signing certificate

#### Linux
- **Build tools**: `sudo apt-get install build-essential`
- **For AppImage**: `sudo apt-get install fuse libfuse2`

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```

3. **Run tests**:
   ```bash
   npm test
   npm run test:coverage
   ```

4. **Lint code**:
   ```bash
   npm run lint
   npm run lint:fix
   ```

## Building

### Pre-build Checks
The `prebuild` script automatically runs linting and tests before building:
```bash
npm run prebuild
```

### Development Build (No Distribution)
Create unpacked app in `dist/` for testing:
```bash
npm run pack
```

### Platform-Specific Builds

#### macOS (DMG + App)
```bash
npm run build:mac
```
**Outputs**:
- `dist/Piper TTS-1.0.0-mac-universal.dmg`
- `dist/mac-universal/Piper TTS.app`

#### Windows (NSIS Installer + Portable)
```bash
npm run build:win
```
**Outputs**:
- `dist/Piper TTS-Setup-1.0.0.exe` (NSIS Installer)
- `dist/Piper TTS-Portable-1.0.0.exe` (Portable)

#### Linux (AppImage, DEB, RPM, TAR.XZ)
```bash
npm run build:linux
```
**Outputs**:
- `dist/Piper TTS-1.0.0-linux-x64.AppImage`
- `dist/Piper TTS-1.0.0-linux-x64.deb`
- `dist/Piper TTS-1.0.0-linux-x64.rpm`
- `dist/Piper TTS-1.0.0-linux-x64.tar.xz`

### Multi-Platform Build
```bash
npm run build:all
```

## Distribution

### Local Distribution
Build without publishing:
```bash
npm run dist
```

### Release to GitHub
```bash
npm run release
```
**Note**: Requires GitHub token and proper repository configuration.

## Build Configuration

### Key Features

#### Security
- **macOS**: Hardened runtime with proper entitlements
- **Windows**: NSIS installer with UAC handling
- **Linux**: Standard AppImage/DEB/RPM packaging

#### File Optimization
- Excludes development files, tests, and documentation
- Compresses binaries for smaller download size
- Includes voice models in `extraResources`

#### Platform Integration
- **macOS**: Proper app categorization and minimum system version
- **Windows**: Desktop shortcuts, start menu entries, file associations
- **Linux**: Desktop file with proper categories and keywords

### Customization

Edit `package.json` `build` section to customize:

- **App metadata**: `appId`, `productName`, `copyright`
- **Icons**: Specify paths to platform-specific icons
- **File inclusion**: Modify `files` array to include/exclude content
- **Platform settings**: Adjust `mac`, `win`, `linux` configurations
- **Installer behavior**: Customize `nsis`, `dmg` settings

## Code Signing

### macOS Code Signing
1. **Obtain certificates**: Apple Developer Program membership required
2. **Configure signing**: Set environment variables:
   ```bash
   export CSC_LINK="path/to/certificate.p12"
   export CSC_KEY_PASSWORD="certificate-password"
   export APPLE_ID="your-apple-id"
   export APPLE_ID_PASSWORD="app-specific-password"
   ```
3. **Build with signing**:
   ```bash
   npm run build:mac
   ```

### Windows Code Signing
1. **Obtain certificate**: From trusted CA
2. **Configure signing**:
   ```bash
   export CSC_LINK="path/to/certificate.p12"
   export CSC_KEY_PASSWORD="certificate-password"
   ```
3. **Build with signing**:
   ```bash
   npm run build:win
   ```

## Troubleshooting

### Common Issues

#### "Icon not found" errors
- Create proper icon files (see `assets/README.md`)
- Or comment out icon references in `package.json`

#### Native module build failures
- Ensure platform build tools are installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

#### Signing failures
- Verify certificates are valid and accessible
- Check environment variables are set correctly

#### Large bundle size
- Review `files` configuration to exclude unnecessary files
- Consider using `asar` packing (enabled by default)

### Debug Build Process
Enable verbose output:
```bash
DEBUG=electron-builder npm run build
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run prebuild
    - run: npm run build
    - uses: actions/upload-artifact@v3
      with:
        name: ${{ matrix.os }}-build
        path: dist/*
```

## Auto-Updates

The application is configured for GitHub-based auto-updates:

1. **Publisher setup**: Configure GitHub repository in `package.json`
2. **Release process**: Use `npm run release` to publish with auto-update support
3. **Client updates**: App will check for updates on startup (when implemented in main process)

## File Structure After Build

```
dist/
├── Piper TTS-1.0.0-mac-universal.dmg          # macOS installer
├── Piper TTS-Setup-1.0.0.exe                  # Windows installer
├── Piper TTS-Portable-1.0.0.exe               # Windows portable
├── Piper TTS-1.0.0-linux-x64.AppImage         # Linux AppImage
├── Piper TTS-1.0.0-linux-x64.deb              # Debian package
├── Piper TTS-1.0.0-linux-x64.rpm              # RPM package
├── Piper TTS-1.0.0-linux-x64.tar.xz           # Linux archive
└── latest*.yml                                 # Auto-update manifests
```

## Next Steps

1. **Create proper icons**: Follow `assets/README.md`
2. **Test builds**: Run `npm run pack` and test the generated app
3. **Set up CI/CD**: Configure GitHub Actions for automated builds
4. **Configure signing**: Set up code signing for production releases
5. **Implement auto-updates**: Add update checking to the main process
