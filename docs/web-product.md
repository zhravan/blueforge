# BlueForge Web Product

The hosted BlueForge workbench is a zero-install developer UI for BLE exploration and testing.

## Included

- Deterministic Mock BLE mode
- Web Bluetooth device selection where supported
- GATT explorer and characteristic selection
- Read/write controls and live notification simulation
- Packet logger with JSONL export
- Protocol editor with browser-local persistence
- Repeatable BLE regression test runner
- Session capture and JSON export
- Local-first settings and storage controls
- GitHub Pages deployment workflow

## Browser limitation

Web Bluetooth is browser-dependent and requires a secure context. The hosted app therefore keeps Mock BLE as a first-class mode. Native desktop BLE adapters remain a separate layer for macOS, Windows and Linux.

## Privacy

The hosted demo has no BlueForge backend. Device data and saved workspace data remain in the browser unless the user explicitly exports them.
