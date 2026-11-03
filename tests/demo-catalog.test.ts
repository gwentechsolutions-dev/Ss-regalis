import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {tamilNaduDemos} from '../src/lib/demo-catalog';
test('Tamil Nadu catalog has valid demo records and real local reference images',()=>{
 assert.equal(tamilNaduDemos.length,8);
 assert.equal(new Set(tamilNaduDemos.map(p=>p.slug)).size,8);
 for(const p of tamilNaduDemos){assert.equal(p.demo,true);assert.ok(p.images.length);for(const im of p.images)assert.ok(existsSync('public'+im.url));assert.ok(p.description.includes('fictional'));}
});
