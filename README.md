# BlueForge

**Open-source BLE development & testing platform.**

Discover. Inspect. Decode. Test. Replay.

BlueForge is designed as a vendor-neutral developer workbench for Bluetooth Low Energy: GATT exploration, packet inspection, protocol decoding, automated tests, session recording and replay.

## Status

Early development — the current release contains the application shell, mock BLE adapter, GATT explorer UI, protocol decoder foundation, and test/session domain models. Native OS BLE adapters are intentionally isolated behind `ble-core`.

## Architecture

```text
React UI → Application layer → Domain packages → BLE abstraction → OS adapter
```

## Development

```bash
npm install
npm run typecheck
npm run test
```

See `docs/architecture.md` and `docs/roadmap.md`.

## License

Apache-2.0
