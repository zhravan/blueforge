export interface SessionPacket {timestamp:number;direction:'TX'|'RX';type:string;characteristicUuid:string;data:string;}
export interface SessionEvent {timestamp:number;type:'connected'|'disconnected'|'service_discovered'|'notification'|'write'|'read'|'error';message?:string;}
export interface BleSession {formatVersion:1;id:string;createdAt:string;device:{id:string;name:string;address?:string};packets:SessionPacket[];events:SessionEvent[];}
export function createSession(device:BleSession['device']):BleSession{return{formatVersion:1,id:crypto.randomUUID(),createdAt:new Date().toISOString(),device,packets:[],events:[]};}
export function serializeSession(session:BleSession):string{return JSON.stringify(session,null,2);}
export function parseSession(input:string):BleSession{const value=JSON.parse(input) as Partial<BleSession>;if(value.formatVersion!==1||!value.id||!value.device||!Array.isArray(value.packets)||!Array.isArray(value.events))throw new Error('Invalid BlueForge session');return value as BleSession;}
