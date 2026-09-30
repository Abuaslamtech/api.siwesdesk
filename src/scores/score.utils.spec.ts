import {
  computeScore,
  decorateScoreWithComputed,
  isScoreComplete,
} from './score.utils';

describe('score.utils (DRY Score Calculations)', () => {
  describe('isScoreComplete', () => {
    it('returns false if score is null or undefined', () => {
      expect(isScoreComplete(null)).toBe(false);
      expect(isScoreComplete(undefined)).toBe(false);
    });

    it('returns false if score is a draft', () => {
      expect(
        isScoreComplete({
          orientation: 10,
          supervisorScore: 40,
          industryScore: 60,
          isDraft: true,
        }),
      ).toBe(false);
    });

    it('returns false if any component is null or missing', () => {
      expect(
        isScoreComplete({
          orientation: null,
          supervisorScore: 40,
          industryScore: 60,
          isDraft: false,
        }),
      ).toBe(false);
      expect(
        isScoreComplete({
          orientation: 10,
          supervisorScore: null,
          industryScore: 60,
          isDraft: false,
        }),
      ).toBe(false);
      expect(
        isScoreComplete({
          orientation: 10,
          supervisorScore: 40,
          industryScore: null,
          isDraft: false,
        }),
      ).toBe(false);
    });

    it('returns true when non-draft and all scores are present (including 0)', () => {
      expect(
        isScoreComplete({
          orientation: 0,
          supervisorScore: 30,
          industryScore: 45,
          isDraft: false,
        }),
      ).toBe(true);
    });
  });

  describe('computeScore', () => {
    it('correctly computes rawTotal, total, siewesFinal, and isComplete', () => {
      const res = computeScore({
        orientation: 10,
        supervisorScore: 40,
        industryScore: 60,
        isDraft: false,
      });

      expect(res.rawTotal).toBe(110);
      expect(res.total).toBe(100);
      expect(res.siewesFinal).toBe(50);
      expect(res.isComplete).toBe(true);
    });

    it('handles null/missing values gracefully with zero defaults', () => {
      const res = computeScore(null);
      expect(res.rawTotal).toBe(0);
      expect(res.total).toBe(0);
      expect(res.siewesFinal).toBe(0);
      expect(res.isComplete).toBe(false);
    });
  });

  describe('decorateScoreWithComputed', () => {
    it('returns null if input is null or undefined', () => {
      expect(decorateScoreWithComputed(null)).toBeNull();
      expect(decorateScoreWithComputed(undefined)).toBeNull();
    });

    it('preserves existing properties while appending computed properties', () => {
      const original = {
        id: 'score-1',
        studentId: 'st-1',
        orientation: 10,
        supervisorScore: 35,
        industryScore: 55,
        isDraft: false,
      };

      const decorated = decorateScoreWithComputed(original);
      expect(decorated).toEqual({
        ...original,
        rawTotal: 100,
        total: 90.9,
        siewesFinal: 45.5,
        isComplete: true,
      });
    });
  });
});
