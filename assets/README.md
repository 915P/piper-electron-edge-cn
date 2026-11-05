# Application Icons

This directory should contain the application icons for different platforms. Currently, we have a placeholder SVG icon that needs to be converted to the required formats.

## Required Icon Files

### macOS (.icns)
- **File**: `icon.icns`
- **Requirements**: Multi-resolution icon set (16x16 to 1024x1024)
- **Tools**: 
  - [iconutil](https://developer.apple.com/library/archive/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html) (macOS built-in)
  - [png2icns](https://github.com/shoogle/png2icns)
  - Online converters

### Windows (.ico)
- **File**: `icon.ico`
- **Requirements**: Multi-resolution icon (16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
- **Tools**:
  - [ImageMagick](https://imagemagick.org/)
  - [GIMP](https://www.gimp.org/)
  - Online converters

### Linux (.png)
- **File**: `icon.png`
- **Requirements**: 512x512 PNG with transparency
- **Note**: Linux uses PNG icons directly

## Icon Creation Process

1. **Design the Icon**: Use the provided `icon.svg` as a starting point
2. **Create PNG versions**: Export the SVG to various PNG sizes:
   - 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512, 1024x1024

3. **Convert to platform formats**:

### For macOS (.icns):
```bash
# Create iconset directory
mkdir icon.iconset

# Add all PNG sizes (rename appropriately)
# icon_16x16.png, icon_32x32.png, etc.

# Generate .icns file
iconutil -c icns icon.iconset
```

### For Windows (.ico):
```bash
# Using ImageMagick
magick convert icon_16x16.png icon_32x32.png icon_48x48.png icon_64x64.png icon_128x128.png icon_256x256.png icon.ico
```

### For Linux:
```bash
# Simply use the 512x512 PNG
cp icon_512x512.png icon.png
```

## Placeholder Status

**⚠️ IMPORTANT**: The current electron-builder configuration references these icon files, but they don't exist yet. You'll need to:

1. Create proper icon files using the process above
2. Place them in this directory with the correct names
3. Or comment out the icon references in `package.json` build configuration if you want to build without custom icons

## Quick Setup for Testing

For quick testing without custom icons, you can comment out these lines in `package.json`:

```json
"mac": {
  // "icon": "assets/icon.icns",  // Comment this out
},
"win": {
  // "icon": "assets/icon.ico",   // Comment this out  
},
"linux": {
  // "icon": "assets/icon.png",   // Comment this out
}
```

Electron-builder will use default icons if none are specified.
