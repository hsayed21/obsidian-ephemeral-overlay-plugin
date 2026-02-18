# Ephemeral Overlay

A temporary drawing overlay plugin for Obsidian that lets you draw freehand annotations on top of your notes — like ZoomIt or Epic Pen. Perfect for presentations, teaching, or quick visual annotations.

**Key Feature**: All drawings are ephemeral — nothing is saved to disk. When you exit drawing mode, everything disappears.

## Features

- **Freehand Drawing** - Draw directly on top of your Markdown notes
- **Multi-Input Support** - Works with mouse, touch, and Apple Pencil
- **Color Options** - Six vibrant colors: red, yellow, blue, green, orange, pink
- **Adjustable Pen Width** - 5 different sizes (2px to 16px)
- **Auto-Fade Modes** - Strokes automatically disappear (1s, 3s, 5s, 7s)
- **Mobile-Friendly** - Full iPad support with touch-optimized toolbar
- **Pen-Only Mode** - Draw with Apple Pencil, scroll with finger simultaneously
- **Keyboard Shortcuts** - Quick access to all tools
- **Zero Persistence** - Drawings never saved, always temporary

## Usage

### Activating Drawing Mode

| Method | Description |
|--------|-------------|
| **View Action Button** | Tap pen icon beside Edit/Read buttons (fastest!) |
| **Ribbon Icon** | Click pencil icon in left sidebar |
| **Command Palette** | Ctrl/Cmd + P → "Toggle Drawing Overlay" |
| **Keyboard Shortcut** | Ctrl+Shift+D (desktop) |

### Keyboard Shortcuts (Desktop)

| Key | Action |
|-----|--------|
| `R/Y/B/G/O/P` | Switch color (Red/Yellow/Blue/Green/Orange/Pink) |
| `1-5` | Pen width (2px to 16px) |
| `F` | Cycle fade mode |
| `E` | Clear all drawings |
| `Esc` | Exit drawing mode |
| `Ctrl + Scroll` | Adjust pen width |

### Auto-Fade Modes

| Mode | Duration |
|------|----------|
| Off | Never fades |
| Quick | 1 second |
| Medium | 3 seconds |
| Long | 5 seconds |
| Very Long | 7 seconds |

## Installation

1. Download release files (`main.js`, `manifest.json`, `styles.css`)
2. Copy to `<Vault>/.obsidian/plugins/ephemeral-overlay/`
3. Reload Obsidian and enable in Settings → Community plugins

### Development

```bash
npm install
npm run build    # Production
npm run dev      # Watch mode
```

## Project Structure

```
src/
  main.ts               # Plugin entry point
  overlay.ts            # Main overlay orchestrator
  constants.ts          # Centralized configuration
  content-freezer.ts    # Freeze/unfreeze content elements
  pointer-tracker.ts    # Pointer state management
  canvas-renderer.ts    # Canvas drawing operations
  fade-animator.ts      # Fade animation logic
  toolbar.ts            # Mobile toolbar
  settings.ts           # Settings UI
  types.ts              # TypeScript types
```

## Requirements

- Obsidian v0.15.0+
- Desktop or mobile (iOS/iPadOS)

## Privacy

- Zero network requests
- No telemetry
- Drawings exist only in memory
- All resources cleaned up on exit

---

**Remember**: All drawings are ephemeral. Nothing is saved! 🎨

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE.txt) - see the LICENSE file for details.
