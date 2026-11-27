import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const sandbox = {};
const script = new URL('./direction.js', import.meta.url);
runInNewContext(readFileSync(script, 'utf8'), sandbox, { filename: script.pathname });
const { direction } = sandbox.__aiChatRtl;

assert.equal(direction('שלום עולם'), 'rtl');
assert.equal(direction('Hello world'), 'ltr');
assert.equal(direction('API Gateway מחזיר שגיאה רק אחרי שהחיבור נפתח (HTTP 502).'), 'rtl');
assert.equal(direction('The message says שלום before the next line.'), 'ltr');
assert.equal(direction('مرحبا بالعالم'), 'rtl');
assert.equal(direction('پژوهش'), 'rtl');
assert.equal(direction('ܫܠܡܐ'), 'rtl');
assert.equal(direction('ދިވެހި'), 'rtl');
assert.equal(direction('ߒߞߏ'), 'rtl');
assert.equal(direction('abc אב'), 'rtl');
assert.equal(direction('abcd אב'), 'ltr');
assert.equal(direction('https://example.test/שלום www.example.test name@example.test 123 ۱۲۳'), null);
assert.equal(direction(''), null);

console.log('ok');
