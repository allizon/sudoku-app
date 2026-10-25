// Moving the Selected cell with the arrow keys (TASK-3, AC #3, #4, #9; keymap.md §4).
// Pure core logic: a position and a direction in, the new position out.
import { moveSelection, type Position } from './selection';

/** A 0-based position, row then column. */
const at = (row: number, column: number): Position => ({ row, column });

describe('Selection movement: each arrow key moves the Selected cell one cell', () => {
  it('right moves one column right in the same row', () => {
    expect(moveSelection(at(4, 4), 'right')).toEqual(at(4, 5));
  });

  it('left moves one column left in the same row', () => {
    expect(moveSelection(at(4, 4), 'left')).toEqual(at(4, 3));
  });

  it('down moves one row down in the same column', () => {
    expect(moveSelection(at(4, 4), 'down')).toEqual(at(5, 4));
  });

  it('up moves one row up in the same column', () => {
    expect(moveSelection(at(4, 4), 'up')).toEqual(at(3, 4));
  });
});

describe('Selection movement: movement wraps within the same row or column', () => {
  it('right from column 9 goes to column 1 of the same row', () => {
    expect(moveSelection(at(2, 8), 'right')).toEqual(at(2, 0));
  });

  it('left from column 1 goes to column 9 of the same row', () => {
    expect(moveSelection(at(2, 0), 'left')).toEqual(at(2, 8));
  });

  it('down from row 9 goes to row 1 of the same column', () => {
    expect(moveSelection(at(8, 6), 'down')).toEqual(at(0, 6));
  });

  it('up from row 1 goes to row 9 of the same column', () => {
    expect(moveSelection(at(0, 6), 'up')).toEqual(at(8, 6));
  });

  it('the corners wrap too: right from row 9, column 9 and up from row 1, column 1', () => {
    expect(moveSelection(at(8, 8), 'right')).toEqual(at(8, 0));
    expect(moveSelection(at(0, 0), 'up')).toEqual(at(8, 0));
  });
});

describe('Selection movement: the input is not changed', () => {
  it('returns a new position and leaves the given one as it was', () => {
    const start = at(1, 1);
    moveSelection(start, 'down');
    expect(start).toEqual(at(1, 1));
  });
});
