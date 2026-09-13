# Architecture

BlueForge is deliberately split into UI, application, domain and infrastructure layers.

- `apps/desktop`: React/Tauri presentation layer.
- `packages/ble-core`: vendor/platform-neutral BLE contracts and mock adapter.
- `packages/protocol-engine`: binary schema decoding.
- `packages/test-engine`: deterministic BLE test definitions and execution model.
- `packages/session-engine`: portable recording/session representation.

The UI must never depend directly on a platform BLE API. Native adapters implement the `BleAdapter` contract.
