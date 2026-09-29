import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('index.html contains essential dashboard elements', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.ok(html.includes('Girlies Glow'), 'must contain brand title');
  assert.ok(html.includes('APPROVE ALL') || html.includes('approve-all-btn'), 'must contain approve all button');
  assert.ok(html.includes('SCHEDULE ALL') || html.includes('schedule-all-btn'), 'must contain schedule all button');
  assert.ok(html.includes('editModal') || html.includes('edit-modal'), 'must contain edit modal');
  assert.ok(html.includes('Pakistan Standard Time') || html.includes('PKT'), 'must specify PKT timezone');
  assert.ok(html.includes('@girli_esglow'), 'must display Instagram handle');
  assert.ok(html.includes('Girlies Glow Facebook Business Page') || html.includes('61592791861631'), 'must display verified Facebook Business Page');
});
