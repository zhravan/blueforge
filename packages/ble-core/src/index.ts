export type DeviceId = string;
export type UUID = string;

export interface BleDevice {
  id: DeviceId;
  name: string;
  address?: string;
  rssi: number;
  status: 'available' | 'connecting' | 'connected' | 'disconnected';
  serviceCount: number;
}

export interface GattService { uuid: UUID; name: string; characteristics: GattCharacteristic[]; }
export interface GattCharacteristic {
  uuid: UUID;
  name: string;
  properties: Array<'read'|'write'|'writeWithoutResponse'|'notify'|'indicate'>;
}

export interface BlePacket {
  timestamp: number;
  direction: 'TX' | 'RX';
  type: 'read' | 'write' | 'writeResponse' | 'notification' | 'indication';
  characteristicUuid: UUID;
  data: Uint8Array;
}

export interface BleAdapter {
  scan(options?: { timeoutMs?: number }): AsyncIterable<BleDevice>;
  connect(deviceId: DeviceId): Promise<void>;
  disconnect(deviceId: DeviceId): Promise<void>;
  discoverServices(deviceId: DeviceId): Promise<GattService[]>;
  read(deviceId: DeviceId, characteristicUuid: UUID): Promise<Uint8Array>;
  write(deviceId: DeviceId, characteristicUuid: UUID, data: Uint8Array, withoutResponse?: boolean): Promise<void>;
  subscribe(deviceId: DeviceId, characteristicUuid: UUID, listener: (packet: BlePacket) => void): Promise<() => void>;
}

export class MockBleAdapter implements BleAdapter {
  private devices: BleDevice[] = [
    { id: 'furrever-123', name: 'Furrever Tracker', address: 'C4:12:34:56:78:9A', rssi: -48, status: 'available', serviceCount: 5 },
    { id: 'sensor-tag', name: 'SensorTag', address: 'D4:5E:6F:78:9A:BC', rssi: -62, status: 'available', serviceCount: 8 },
    { id: 'thermo-node', name: 'ThermoNode', address: 'F2:33:44:55:66:77', rssi: -81, status: 'available', serviceCount: 6 }
  ];
  private subscriptions = new Map<string, Set<(packet: BlePacket) => void>>();
  private services: GattService[] = [{ uuid: '180F', name: 'Battery Service', characteristics: [{ uuid: '2A19', name: 'Battery Level', properties: ['read','notify'] }] }, { uuid: 'FFF0', name: 'Sensor Service', characteristics: [{ uuid: 'FFF1', name: 'Sensor Data', properties: ['read','notify'] }, { uuid: 'FFF2', name: 'Configuration', properties: ['read','write'] }, { uuid: 'FFF3', name: 'Control', properties: ['write'] }] }];

  async *scan(): AsyncIterable<BleDevice> { for (const device of this.devices) { await new Promise(r => setTimeout(r, 120)); yield {...device}; } }
  async connect(id: string) { const d = this.devices.find(x => x.id === id); if (!d) throw new Error('Device not found'); d.status = 'connected'; }
  async disconnect(id: string) { const d = this.devices.find(x => x.id === id); if (d) d.status = 'disconnected'; }
  async discoverServices() { return structuredClone(this.services); }
  async read(_id: string, uuid: string) { if (uuid === '2A19') return Uint8Array.from([92]); return Uint8Array.from([1, 0xFF, 0x23, 0x04, 0x7A, 0]); }
  async write(_id: string, _uuid: string, _data: Uint8Array) { /* mock transport */ }
  async subscribe(deviceId: string, characteristicUuid: string, listener: (packet: BlePacket) => void) {
    const key = `${deviceId}:${characteristicUuid}`; let set = this.subscriptions.get(key); if (!set) { set = new Set(); this.subscriptions.set(key, set); }
    set.add(listener);
    const timer = setInterval(() => { for (const fn of set!) fn({ timestamp: Date.now(), direction: 'RX', type: 'notification', characteristicUuid, data: Uint8Array.from([1,0xFF, Math.floor(Math.random()*20)+20,4,0x7A,0]) }); }, 250);
    return () => { clearInterval(timer); set!.delete(listener); };
  }
}
