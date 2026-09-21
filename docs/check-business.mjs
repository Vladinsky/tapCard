import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from '../node_modules/typescript/lib/typescript.js'

async function loadUtility(name) {
  const source = await readFile(new URL(`../src/utils/${name}.ts`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}

const { webUrl, reviewUrl, normalizePhone, resolveActions, imageUrl } = await loadUtility('businessLinks')
const { businessTheme } = await loadUtility('businessTheme')
for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///tmp/a', '//example.com', 'example.com', 'https://user:pass@example.com']) assert.equal(webUrl(url), undefined)
for (const url of ['https://google.com.evil.test/maps?cid=12', 'https://evilgoogle.com/maps?cid=12', 'https://www.google.com', 'https://g.page/r/example', 'https://search.google.com/local/writereview']) assert.equal(reviewUrl(url), undefined)
// Synthetic destinations are test fixtures only: never shown to visitors or opened.
assert.equal(reviewUrl('https://search.google.com/local/writereview?placeid=test'), 'https://search.google.com/local/writereview?placeid=test')
assert.equal(reviewUrl('https://g.page/r/test/review'), 'https://g.page/r/test/review')
assert.equal(normalizePhone('+39 (02) 1234-5678'), '+390212345678')
assert.equal(normalizePhone('0039 333 1234567', true), '+393331234567')
assert.equal(normalizePhone('3331234567', true), undefined)
assert.equal(normalizePhone('++391234567'), undefined)
const actions = resolveActions([
  { id: 'off', type: 'website', url: 'https://example.com', enabled: false },
  { id: 'bad', type: 'website', url: 'javascript:alert(1)' },
  { id: 'tel', type: 'phone', phoneNumber: '+39 02 12345678' },
  { id: 'wa', type: 'whatsapp', phoneNumber: '+39 333 1234567', message: 'Ciao! Spazi & caffè?' },
  { id: 'tel', type: 'phone', phoneNumber: '+39 02 12345678' },
])
assert.deepEqual(actions.map((action) => action.id), ['tel', 'wa'])
assert.equal(actions[0].href, 'tel:+390212345678')
assert.equal(actions[0].external, false)
assert.equal(actions[1].href, 'https://wa.me/393331234567?text=' + encodeURIComponent('Ciao! Spazi & caffè?'))
for (const type of ['website', 'menu', 'catalog', 'instagram', 'facebook', 'directions']) assert.equal(resolveActions([{ id: type, type, url: 'https://example.com' }]).length, 1)
assert.deepEqual(resolveActions([]), [])
assert.equal(businessTheme('#ffffff').foreground, '#000000')
assert.equal(businessTheme('#000000').foreground, '#ffffff')
assert.equal(businessTheme('invalid').primary, '#2563eb')
assert.equal(businessTheme('#ABCDEF').primary, '#abcdef')
assert.equal(imageUrl('/business-demo-logo.svg'), '/business-demo-logo.svg')
assert.equal(imageUrl('//evil.test/image.svg'), undefined)
assert.equal(imageUrl('/\\evil.test/image.svg'), undefined)
assert.equal(imageUrl('data:image/svg+xml,test'), undefined)
console.log('Business checks passed: URLs, Google hosts, all action types, phones, WhatsApp, duplicates, empty actions and colors.')
