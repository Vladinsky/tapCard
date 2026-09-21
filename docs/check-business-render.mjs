import assert from 'node:assert/strict'
import { createServer } from '../node_modules/vite/dist/node/index.js'
import { renderToStaticMarkup } from '../node_modules/react-dom/server.node.js'
import { createElement } from '../node_modules/react/index.js'

const server = await createServer({ server: { middlewareMode: true } })
try {
  const { BusinessLandingPage } = await server.ssrLoadModule('/src/components/BusinessLandingPage.tsx')
  const { businesses } = await server.ssrLoadModule('/src/data/businesses.ts')
  const business = { id: 'test', slug: 'test', name: 'Test & <script>', actions: [] }
  const render = (value) => renderToStaticMarkup(createElement(BusinessLandingPage, { business: value }))
  const empty = render(business)
  assert.ok(empty.includes('I collegamenti di questa attività non sono al momento disponibili'))
  assert.ok(!empty.includes('<nav'))
  assert.ok(!empty.includes('<script>'))
  assert.equal((empty.match(/<h1/g) || []).length, 1)
  const review = render({ ...business, googleReviewUrl: 'https://g.page/r/test/review' })
  assert.ok(review.includes('Lascia una recensione'))
  assert.ok(review.includes('noopener noreferrer'))
  assert.ok(review.includes('si apre in una nuova scheda'))
  const fallback = render({ ...business, coverUrl: 'javascript:alert(1)', logoUrl: 'file:///test' })
  assert.ok(!fallback.includes('<img'))
  for (const item of businesses) assert.ok(render(item).includes(item.name))
  console.log('Render checks passed: review CTA, empty actions, unsafe images, escaping and demos. Async loading is tested by the UI suite.')
} finally { await server.close() }
