import {test} from 'node:test';
import assert from 'node:assert/strict';
import {postgresConnection} from '../src/lib/postgres';
test('database TLS preserves verification and CA despite URL SSL parameters',()=>{
 const c=postgresConnection({DATABASE_URL:'postgresql://user:pass@db.example.com:6543/postgres?sslmode=require&sslrootcert=wrong&application_name=regalis',DATABASE_SSL:'true',DATABASE_CA_CERT:'CERT\\nLINE'});
 assert.equal(c.ssl && c.ssl.rejectUnauthorized,true);
 assert.ok(c.ssl && c.ssl.ca?.includes('CERT\nLINE'));
 assert.equal(new URL(c.connectionString).searchParams.has('sslmode'),false);
 assert.equal(new URL(c.connectionString).searchParams.get('application_name'),'regalis');
});
test('database TLS without custom certificate still verifies certificates',()=>{
 const c=postgresConnection({DATABASE_URL:'postgresql://user:pass@db.example.com/db',DATABASE_SSL:'true'});
 assert.deepEqual(c.ssl,{rejectUnauthorized:true});
});
