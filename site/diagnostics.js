// BlueForge BLE diagnostics, advertising and multi-device demo engine.
export const DIAGNOSTIC_FIELDS = [
  ['RSSI', 'rssi', 'dBm'], ['MTU', 'mtu', 'bytes'], ['PHY', 'phy', ''],
  ['Connection interval', 'interval', 'ms'], ['TX power', 'txPower', 'dBm'],
  ['Notifications/s', 'notificationsPerSecond', 'Hz'], ['Packets', 'packets', ''],
  ['Packet loss', 'packetLoss', '%'], ['Latency', 'latency', 'ms']
];

export function diagnosticSnapshot(device, packets = 0) {
  return {
    rssi: device.rssi ?? 0,
    mtu: device.mtu ?? 23,
    phy: device.phy ?? '1M',
    interval: device.interval ?? 30,
    txPower: device.txPower ?? null,
    notificationsPerSecond: device.notificationsPerSecond ?? 0,
    packets,
    packetLoss: device.packetLoss ?? 0,
    latency: device.latency ?? 0
  };
}

export function parseAdvertisement(bytes = []) {
  const out = [];
  let i = 0;
  while (i < bytes.length) {
    const length = bytes[i++];
    if (!length || i + length > bytes.length + 1) break;
    const type = bytes[i++];
    const data = bytes.slice(i, i + length - 1);
    out.push({ type: `0x${type.toString(16).padStart(2, '0')}`, length: data.length, data });
    i += length - 1;
  }
  return out;
}

export const AD_TYPES = {
  0x01: 'Flags', 0x02: '16-bit UUIDs', 0x03: '16-bit UUIDs',
  0x06: '128-bit UUIDs', 0x07: '128-bit UUIDs', 0x08: 'Short name',
  0x09: 'Complete name', 0x16: 'Service Data', 0x19: 'Appearance',
  0xff: 'Manufacturer data'
};

export function formatAdType(type) { return AD_TYPES[Number(type)] ?? 'AD structure'; }

export class MultiDeviceManager {
  constructor(adapter) { this.adapter = adapter; this.devices = new Map(); }
  async connect(device) {
    await this.adapter.connect(device.id);
    this.devices.set(device.id, { ...device, connected: true, connectedAt: Date.now() });
    return this.devices.get(device.id);
  }
  async disconnect(id) {
    await this.adapter.disconnect(id);
    const device = this.devices.get(id);
    if (device) this.devices.set(id, { ...device, connected: false });
  }
  connected() { return [...this.devices.values()].filter(d => d.connected); }
  all() { return [...this.devices.values()]; }
  async disconnectAll() { await Promise.all(this.connected().map(d => this.disconnect(d.id))); }
}
