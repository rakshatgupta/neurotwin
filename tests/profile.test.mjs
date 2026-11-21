import test from 'node:test';
import assert from 'node:assert/strict';
import {username,displayName} from '../lib/profile.ts';
test('username is canonical and bounded',()=>{assert.equal(username('  Anand_01 '),'anand_01');for(const s of ['ab','1abc','abc xyz','a'.repeat(25),'<x>'])assert.throws(()=>username(s));});
test('display names remain labels and need not be unique',()=>{assert.equal(displayName('  Anand   Kumar '),'Anand Kumar');for(const s of [' ','a'.repeat(61),'A\u200bB','<b>'])assert.throws(()=>displayName(s));});
