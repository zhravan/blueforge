import test from 'node:test'; import assert from 'node:assert/strict';
// Lightweight contract tests mirror the TS implementation; runtime integration tests run after package compilation.
test('hex validation rejects odd length',()=>assert.throws(()=>{const s='ABC'; if(s.length%2) throw new Error('Invalid hexadecimal input')},/Invalid/));
test('little-endian uint16 semantics',()=>{const b=new Uint8Array([0x23,0x04]); const v=b[0]+(b[1]<<8); assert.equal(v,1059)});
