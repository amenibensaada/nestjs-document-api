const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { Test } = require('@nestjs/testing');
const { AppModule, configure } = require('../dist/app');
let app;
before(async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = configure(module.createNestApplication());
  app.useLogger(false);
  await app.init();
});
after(async () => { await app?.close(); });
const api = () => request(app.getHttpServer());

test('health exposes the demo storage type', async () => {
  const response = await api().get('/api/health').expect(200);
  assert.deepEqual(response.body, { status: 'ok', storage: 'memory' });
});
test('create, retrieve, list metadata and delete a document', async () => {
  const created = await api().post('/api/documents').send({ title: '  Release notes  ', content: 'A reproducible delivery example.' }).expect(201);
  assert.equal(created.body.title, 'Release notes');
  const detail = await api().get('/api/documents/' + created.body.id).expect(200);
  assert.equal(detail.body.content, 'A reproducible delivery example.');
  const listing = await api().get('/api/documents?limit=1').expect(200);
  assert.equal(listing.body.items[0].id, created.body.id);
  assert.equal('content' in listing.body.items[0], false);
  await api().delete('/api/documents/' + created.body.id).expect(204);
  await api().get('/api/documents/' + created.body.id).expect(404);
});
for (const payload of [{}, { title: ' ', content: 'text' }, { title: 'Title', content: '' }, { title: 42, content: 'text' }, { title: 'Title', content: 'text', owner: 'admin' }, { title: 'x'.repeat(121), content: 'text' }]) {
  test('reject invalid or unexpected input: ' + JSON.stringify(payload).slice(0,70), async () => {
    await api().post('/api/documents').send(payload).expect(400);
  });
}
for (const limit of ['0', '-1', '51', 'wrong', '1.5']) {
  test('reject invalid list limit ' + limit, async () => { await api().get('/api/documents?limit=' + limit).expect(400); });
}
test('invalid IDs and absent documents have distinct responses', async () => {
  await api().get('/api/documents/not-a-uuid').expect(400);
  await api().get('/api/documents/00000000-0000-4000-8000-000000000000').expect(404);
  await api().delete('/api/documents/00000000-0000-4000-8000-000000000000').expect(404);
});
