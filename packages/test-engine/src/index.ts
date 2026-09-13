export type Assertion = {kind:'connected'|'notifications_gt'|'latency_lt'|'packet_loss_lt'|'mtu_gte'; value:boolean|number};
export type TestStep = {action:'connect'|'disconnect'|'reconnect'|'discover_services'|'subscribe'|'wait'|'assert'; characteristic?:string; durationMs?:number; assertion?:Assertion};
export interface BleTest {name:string; deviceId:string; steps:TestStep[];}
export interface StepResult {step:number; status:'passed'|'failed'; durationMs:number; message:string;}
export interface TestResult {name:string; status:'passed'|'failed'; durationMs:number; steps:StepResult[];}
export function validateTest(test:BleTest):string[]{const errors:string[]=[]; if(!test.name.trim())errors.push('Test name is required'); if(!test.deviceId.trim())errors.push('Device ID is required'); test.steps.forEach((s,i)=>{if(s.action==='subscribe'&&!s.characteristic)errors.push(`Step ${i+1}: characteristic is required`);if(s.action==='wait'&&(!s.durationMs||s.durationMs<1))errors.push(`Step ${i+1}: durationMs must be positive`);});return errors;}
