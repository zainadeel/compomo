import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSafetyScoreLevel, resolveScoreLevel } from '../src/wc/components/Score/score-model';

test('infers safety-score levels from 0–100 and ignores out-of-range values', () => {
  assert.equal(resolveSafetyScoreLevel(0), 'fair');
  assert.equal(resolveSafetyScoreLevel(50), 'fair');
  assert.equal(resolveSafetyScoreLevel(51), 'good');
  assert.equal(resolveSafetyScoreLevel(80), 'good');
  assert.equal(resolveSafetyScoreLevel(81), 'excellent');
  assert.equal(resolveSafetyScoreLevel(100), 'excellent');
  assert.equal(resolveSafetyScoreLevel('87'), 'excellent');
  assert.equal(resolveSafetyScoreLevel('unavailable'), undefined);
  assert.equal(resolveSafetyScoreLevel(101), undefined);
});

test('prefers an explicit score level over inference', () => {
  assert.equal(resolveScoreLevel(87, 'fair'), 'fair');
  assert.equal(resolveScoreLevel(10), 'fair');
  assert.equal(resolveScoreLevel('N/A'), undefined);
});
