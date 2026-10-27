// Normalizing cell constructors (TASK-6 review round 1, CR-3): no cell ever holds an
// empty list of Candidates, whether it holds only Candidates or a Placed digit over them.
import { placedOver, withCandidates, type Candidates } from './puzzle';

const NO_CANDIDATES: Candidates = { centerMarks: [], cornerMarks: [] };

describe('withCandidates: a cell holding only Candidates', () => {
  it('with no Candidates at all, is an empty cell', () => {
    expect(withCandidates(NO_CANDIDATES)).toEqual({ kind: 'empty' });
    expect(withCandidates(NO_CANDIDATES)).toStrictEqual({ kind: 'empty' });
  });

  it('with only Center marks, holds them', () => {
    const candidates: Candidates = { centerMarks: [1, 4], cornerMarks: [] };
    expect(withCandidates(candidates)).toStrictEqual({ kind: 'candidates', candidates });
  });

  it('with only Corner marks, holds them', () => {
    const candidates: Candidates = { centerMarks: [], cornerMarks: [2, 8] };
    expect(withCandidates(candidates)).toStrictEqual({ kind: 'candidates', candidates });
  });

  it('with both, holds both', () => {
    const candidates: Candidates = { centerMarks: [3], cornerMarks: [3, 9] };
    expect(withCandidates(candidates)).toStrictEqual({ kind: 'candidates', candidates });
  });
});

describe('placedOver: a Placed digit hiding Candidates', () => {
  it('with undefined Candidates, has no candidates field', () => {
    const cell = placedOver(5, undefined);
    expect(cell).toStrictEqual({ kind: 'placed', digit: 5 });
    expect(Object.keys(cell)).not.toContain('candidates');
  });

  it('with an empty list of Candidates, has no candidates field', () => {
    const cell = placedOver(5, NO_CANDIDATES);
    expect(cell).toStrictEqual({ kind: 'placed', digit: 5 });
    expect(Object.keys(cell)).not.toContain('candidates');
  });

  it('with Candidates, keeps them hidden under the digit', () => {
    const candidates: Candidates = { centerMarks: [1, 4, 7], cornerMarks: [2, 8] };
    expect(placedOver(5, candidates)).toStrictEqual({ kind: 'placed', digit: 5, candidates });
  });
});
