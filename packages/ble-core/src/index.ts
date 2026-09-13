export type DeviceId = string;
export type UUID = string;

export interface BleDevice { id: DeviceId; name: string; address?: string; rssi: number; status: 'available'|'connecting'|'connected'|'disconnected'; serviceCount: number; }
export interface GattService { uuid: UUID; name: string; characteristics: GattCharacteristic[]; }
export interface GattCharacteristic { uuid: UUID; name: string; properties: Array<'read'|'write'|'writeWithoutResponse'|'notify'|'indicate'>; }
export interface BlePacket { timestamp: number; direction: 'TX'|'RX'; type: 'read'|'write'|'writeResponse'|'notification'|'indication'; characteristicUuid: UUID; data: Uint8Array; }
export interface BleAdapter {
  scan(options?: {timeoutMs?: number}): AsyncIterable<BleDevice>;
  connect(deviceId: DeviceId): Promise<void>; disconnect(deviceId: DeviceId): Promise<void>;
  discoverServices(deviceId: DeviceId): Promise<GattService[]>;
  read(deviceId: DeviceId, characteristicUuid: UUID): Promise<Uint8Array>;
  write(deviceId: DeviceId, characteristicUuid: UUID, data: Uint8Array, withoutResponse?: boolean): Promise<void>;
  subscribe(deviceId: DeviceId, characteristicUuid: UUID, listener: (packet: BlePacket)=>void): Promise<()=>void>;
}

export class MockBleAdapter implements BleAdapter {
  private devices: BleDevice[] = [
    {id:'furrever-123',name:'Furrever Tracker',address:'C4:12:34:56:78:9A',rssi:-48,status:'available',serviceCount:5},
    {id:'sensor-tag',name:'SensorTag',address:'D4:5E:6F:78:9A:BC',rssi:-62,status:'available',serviceCount:8},
    {id:'thermo-node',name:'ThermoNode',address:'F2:33:44:55:66:77',rssi:-81,status:'available',serviceCount:6}
  ];
  private subscriptions = new Map<string, Set<(packet: BlePacket)=>void>>();
  private services: GattService[] = [{uuid:'180F',name:'Battery Service',characteristics:[{uuid:'2A19',name:'Battery Level',properties:['read','notify']}]},{uuid:'FFF0',name:'Sensor Service',characteristics:[{uuid:'FFF1',name:'Sensor Data',properties:['read','notify']},{uuid:'FFF2',name:'Configuration',properties:['read','write']},{uuid:'FFF3',name:'Control',properties:['write']}]}];
  async *scan(): AsyncIterable<BleDevice> { for(const device of this.devices){await new Promise(r=>setTimeout(r,120));yield {...device};} }
  async connect(id:string){const d=this.devices.find(x=>x.id===id);if(!d)throw new Error('Device not found');d.status='connected';}
  async disconnect(id:string){const d=this.devices.find(x=>x.id===id);if(d)d.status='disconnected';}
  async discoverServices(){return structuredClone(this.services);}
  async read(_id:string,uuid:string){if(uuid==='2A19')return Uint8Array.from([92]);return Uint8Array.from([1,0xFF,0x23,0x04,0x7A,0]);}
  async write(_id:string,_uuid:string,_data:Uint8Array){ }
  async subscribe(deviceId:string,characteristicUuid:string,listener:(packet:BlePacket)=>void){const key=`${deviceId}:${characteristicUuid}`;let set=this.subscriptions.get(key);if(!set){set=new Set();this.subscriptions.set(key,set);}set.add(listener);const timer=setInterval(()=>{for(const fn of set!)fn({timestamp:Date.now(),direction:'RX',type:'notification',characteristicUuid,data:Uint8Array.from([1,0xFF,Math.floor(Math.random()*20)+20,4,0x7A,0])});},250);return()=>{clearInterval(timer);set!.delete(listener);};}
}

/** Real browser transport for environments implementing Web Bluetooth. */
export class WebBluetoothAdapter implements BleAdapter {
  private devices = new Map<DeviceId, BluetoothDevice>();
  private characteristics = new Map<string, BluetoothRemoteGATTCharacteristic>();
  async *scan(): AsyncIterable<BleDevice> {
    if (!('bluetooth' in navigator)) throw new Error('Web Bluetooth is not supported in this browser');
    const device=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:['battery_service']});
    this.devices.set(device.id,device); yield {id:device.id,name:device.name||'Unnamed BLE device',rssi:0,status:'available',serviceCount:0};
  }
  private getDevice(id:DeviceId){const device=this.devices.get(id);if(!device)throw new Error(`Unknown BLE device: ${id}`);return device;}
  async connect(id:DeviceId){const gatt=await this.getDevice(id).gatt?.connect();if(!gatt)throw new Error('GATT server unavailable');}
  async disconnect(id:DeviceId){const gatt=this.getDevice(id).gatt;if(gatt?.connected)gatt.disconnect();}
  async discoverServices(id:DeviceId):Promise<GattService[]>{const server=await this.getDevice(id).gatt?.connect();if(!server)throw new Error('GATT server unavailable');const result:GattService[]=[];for(const service of await server.getPrimaryServices()){const chars=await service.getCharacteristics();result.push({uuid:normalizeUuid(service.uuid),name:service.uuid,characteristics:chars.map(c=>{this.characteristics.set(`${id}:${normalizeUuid(c.uuid)}`,c);return{uuid:normalizeUuid(c.uuid),name:c.uuid,properties:mapProperties(c.properties)}})});}return result;}
  private async getCharacteristic(id:DeviceId,uuid:UUID){const key=`${id}:${normalizeUuid(uuid)}`;const cached=this.characteristics.get(key);if(cached)return cached;const server=await this.getDevice(id).gatt?.connect();if(!server)throw new Error('GATT server unavailable');for(const service of await server.getPrimaryServices()){try{const c=await service.getCharacteristic(uuid);this.characteristics.set(key,c);return c;}catch{}}throw new Error(`Characteristic not found: ${uuid}`);}
  async read(id:DeviceId,uuid:UUID){const value=await (await this.getCharacteristic(id,uuid)).readValue();return new Uint8Array(value.buffer.slice(value.byteOffset,value.byteOffset+value.byteLength));}
  async write(id:DeviceId,uuid:UUID,data:Uint8Array,withoutResponse=false){const c=await this.getCharacteristic(id,uuid);if(withoutResponse&&c.writeValueWithoutResponse)await c.writeValueWithoutResponse(data);else if(c.writeValueWithResponse)await c.writeValueWithResponse(data);else await c.writeValue(data);}
  async subscribe(id:DeviceId,uuid:UUID,listener:(packet:BlePacket)=>void){const c=await this.getCharacteristic(id,uuid);const handler=(event:Event)=>{const value=(event.target as BluetoothRemoteGATTCharacteristic).value;if(!value)return;listener({timestamp:Date.now(),direction:'RX',type:c.properties.includes('indicate')?'indication':'notification',characteristicUuid:normalizeUuid(c.uuid),data:new Uint8Array(value.buffer.slice(value.byteOffset,value.byteOffset+value.byteLength))});};c.addEventListener('characteristicvaluechanged',handler);await c.startNotifications();return()=>{c.removeEventListener('characteristicvaluechanged',handler);void c.stopNotifications();};}
}
function normalizeUuid(uuid:string){const m=uuid.match(/^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/i);return(m?m[1]:uuid).toUpperCase();}
function mapProperties(p:BluetoothCharacteristicProperties):GattCharacteristic['properties']{const out:GattCharacteristic['properties']=[];if(p.read)out.push('read');if(p.write)out.push('write');if(p.writeWithoutResponse)out.push('writeWithoutResponse');if(p.notify)out.push('notify');if(p.indicate)out.push('indicate');return out;}
