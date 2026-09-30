import { ScoresService } from './scores.service';
import { Score } from './score.entity';

describe('ScoresService - Score Conversion', () => {
  let service: ScoresService;

  beforeEach(() => {
    // Instantiate ScoresService with dummy repos for pure logic testing
    service = new ScoresService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('correctly converts maximum raw score 110 (10 + 40 + 60) to 100 total and 50 final', () => {
    const score = new Score();
    score.orientation = 10;
    score.supervisorScore = 40;
    score.industryScore = 60;
    score.isDraft = false;

    const computed = (service as any).withComputed(score);

    expect(computed.rawTotal).toBe(110);
    expect(computed.total).toBe(100);
    expect(computed.siewesFinal).toBe(50);
    expect(computed.isComplete).toBe(true);
  });

  it('correctly converts minimum raw score 0 (0 + 0 + 0) to 0 total and 0 final', () => {
    const score = new Score();
    score.orientation = 0;
    score.supervisorScore = 0;
    score.industryScore = 0;
    score.isDraft = false;

    const computed = (service as any).withComputed(score);

    expect(computed.rawTotal).toBe(0);
    expect(computed.total).toBe(0);
    expect(computed.siewesFinal).toBe(0);
    expect(computed.isComplete).toBe(true);
  });

  it('correctly scales intermediate scores proportionally', () => {
    // Example: orientation 10, supervisor 35, industry 44 => rawTotal = 89
    // (89 / 110) * 100 = 80.9090... => rounded to 80.9
    // siewesFinal = 80.9 / 2 = 40.45 => rounded to 40.5
    const score = new Score();
    score.orientation = 10;
    score.supervisorScore = 35;
    score.industryScore = 44;
    score.isDraft = false;

    const computed = (service as any).withComputed(score);

    expect(computed.rawTotal).toBe(89);
    expect(computed.total).toBe(80.9);
    expect(computed.siewesFinal).toBe(40.5);
    expect(computed.isComplete).toBe(true);
  });
});
