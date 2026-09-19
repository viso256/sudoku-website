import assert from 'node:assert/strict';
import test from 'node:test';

import { parseGeneratedSudoku } from './sudoku.ts';

test('parseGeneratedSudoku converts nulls into empty cells', () => {
	const raw = JSON.stringify({
		puzzle: [
			[7, null, 1, null, null, 3, 9, null, null],
			[null, null, null, null, null, null, null, null, null],
			[2, null, null, null, 8, 9, 3, 5, null],
			[null, 7, 3, null, null, null, null, null, null],
			[null, null, null, 4, null, null, null, null, null],
			[null, null, null, null, null, null, null, 2, null],
			[null, null, null, null, 1, null, null, null, null],
			[null, null, 4, null, null, null, null, null, 9],
			[null, 2, null, null, null, null, null, 8, null]
		],
		solution: [
			[7, 8, 1, 4, 5, 3, 9, 6, 2],
			[9, 6, 5, 2, 1, 7, 4, 3, 8],
			[2, 4, 3, 6, 8, 9, 3, 5, 1],
			[8, 7, 3, 1, 9, 6, 2, 4, 5],
			[5, 1, 2, 4, 3, 8, 7, 9, 6],
			[4, 9, 6, 5, 7, 2, 1, 3, 8],
			[3, 5, 9, 8, 1, 4, 6, 7, 2],
			[1, 3, 4, 7, 6, 5, 8, 2, 9],
			[6, 2, 7, 9, 8, 1, 5, 8, 4]
		]
	});

	const board = parseGeneratedSudoku(raw);

	assert.deepEqual(board[0], [7, 0, 1, 0, 0, 3, 9, 0, 0]);
	assert.equal(board[1][0], 0);
	assert.equal(board[8][8], 0);
});
