# BlueForge

**Open-source BLE development & testing platform.**

Discover. Inspect. Decode. Test. Replay.

BlueForge is a vendor-neutral developer workbench for Bluetooth Low Energy: GATT exploration, packet inspection, protocol decoding, automated tests, session recording and replay.

## Current capabilities

- React/Vite developer workspace
- Mock BLE adapter for deterministic development
- Real browser BLE transport via Web Bluetooth where supported
- GATT service/characteristic exploration
- Read/write/notification interaction model
- Packet log and live notification view
- Protocol decoder foundation
- BLE test/session domain models
- GitHub Actions CI foundation

## Architecture

```text
UI → application workflows → domain packages → BleAdapter → transport
                                      ├──────────── mock
                                      └──────────── Web Bluetooth
```

The `BleAdapter` contract is deliberately transport-neutral so native desktop adapters can be added without rewriting the application layer.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Roadmap

See `docs/roadmap.md` for the implementation plan. The next major milestone is native cross-platform BLE plus persistence, followed by the protocol editor, automated test runner, replay and CLI.

## License

Apache-2.0
