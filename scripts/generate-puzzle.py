#!/usr/bin/env python3
"""Generate a sudoku puzzle with exactly one solution, reproducibly from a seed.

Usage: scripts/generate-puzzle.py [--rows] SEED MIN_GIVENS
Prints: puzzle (81 chars, '.' empty), solution, given count.
With --rows: only the puzzle as nine lines of nine, then a blank line, then
the solution as nine lines of nine (the format of fixtures/puzzles/).

The fixtures in fixtures/puzzles/ came from seeds 1 and 2:
  scripts/generate-puzzle.py --rows 1 36   -> puzzle-1.txt, puzzle-1.solution.txt
  scripts/generate-puzzle.py --rows 2 28   -> puzzle-2.txt, puzzle-2.solution.txt
"""
import random
import sys


def peers(i):
    r, c = divmod(i, 9)
    br, bc = r // 3 * 3, c // 3 * 3
    s = {r * 9 + k for k in range(9)} | {k * 9 + c for k in range(9)}
    s |= {(br + a) * 9 + bc + b for a in range(3) for b in range(3)}
    s.discard(i)
    return s


PEERS = [peers(i) for i in range(81)]


def count_solutions(grid, limit=2):
    """Count solutions up to `limit` by backtracking on the most constrained cell."""
    g = list(grid)
    found = 0

    def options(i):
        return set(range(1, 10)) - {g[p] for p in PEERS[i]}

    def solve():
        nonlocal found
        best, best_opts = None, None
        for i in range(81):
            if g[i] == 0:
                o = options(i)
                if best is None or len(o) < len(best_opts):
                    best, best_opts = i, o
                    if not o:
                        return
        if best is None:
            found += 1
            return
        for d in best_opts:
            g[best] = d
            solve()
            g[best] = 0
            if found >= limit:
                return

    solve()
    return found


def full_grid(rng):
    g = [0] * 81

    def fill(i):
        if i == 81:
            return True
        digits = list(range(1, 10))
        rng.shuffle(digits)
        for d in digits:
            if all(g[p] != d for p in PEERS[i]):
                g[i] = d
                if fill(i + 1):
                    return True
        g[i] = 0
        return False

    fill(0)
    return g


def make(seed, min_givens):
    rng = random.Random(seed)
    solution = full_grid(rng)
    puzzle = list(solution)
    # Remove cells in 180°-symmetric pairs while the solution stays unique.
    pairs = list(range(41))
    rng.shuffle(pairs)
    for i in pairs:
        j = 80 - i
        cells = {i, j}
        if sum(1 for v in puzzle if v) - len(cells) < min_givens:
            continue
        saved = {k: puzzle[k] for k in cells}
        for k in cells:
            puzzle[k] = 0
        if count_solutions(puzzle) != 1:
            for k, v in saved.items():
                puzzle[k] = v
    return puzzle, solution


def rows(text):
    """81 characters as nine lines of nine."""
    return '\n'.join(text[r * 9:r * 9 + 9] for r in range(9))


if __name__ == '__main__':
    args = sys.argv[1:]
    as_rows = '--rows' in args
    if as_rows:
        args.remove('--rows')
    seed, min_givens = int(args[0]), int(args[1])
    p, s = make(seed, min_givens)
    assert count_solutions(p, limit=3) == 1
    assert all(p[i] in (0, s[i]) for i in range(81))
    puzzle = ''.join(str(v) if v else '.' for v in p)
    solution = ''.join(map(str, s))
    if as_rows:
        print(rows(puzzle))
        print()
        print(rows(solution))
    else:
        print(puzzle)
        print(solution)
        print(sum(1 for v in p if v))
