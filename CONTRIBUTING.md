# Contributing to BlueForge

## Branches

Use focused branches such as `feat/gatt-explorer`, `feat/protocol-decoder`, or `fix/session-import`.

## Commits

Use Conventional Commits:

- `feat:` new capability
- `fix:` bug fix
- `refactor:` structural change
- `test:` tests only
- `docs:` documentation
- `chore:` tooling

Keep commits small and independently reviewable.

## Quality bar

Every domain feature should have tests. UI code should consume domain interfaces rather than OS Bluetooth APIs directly.
