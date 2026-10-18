import test from 'node:test';
import assert from 'node:assert/strict';
import {explanationSections} from '../lib/explanationText.ts';
test('display sections preserve decimal values, direction and provider text',()=>{
 const sentence='Sleep changed by -0.125 hours/day. Stress was 3.5/10. This is not a diagnosis.';
 const text=Array(12).fill(sentence).join(' ');
 const sections=explanationSections(text);
 assert.ok(sections.length>1);
 assert.equal(sections.join(' '),text);
 assert.ok(sections.every(section=>section.length<550));
});
test('paragraphs and markdown remain literal safe presentation inputs',()=>{
 assert.deepEqual(explanationSections('**Sleep:** 7.5 hours.\n\n<script>not executable</script>'),['**Sleep:** 7.5 hours.','<script>not executable</script>']);
 assert.deepEqual(explanationSections(''),[]);
});
