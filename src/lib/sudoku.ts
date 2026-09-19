import init, { generate_pdf, generate_sudoku } from 'sudoku-wasm';

export type SudokuBoard = number[][];

export const emptyBoard: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0));

export const demoPuzzle: SudokuBoard = [
	[5, 3, 0, 0, 7, 0, 0, 0, 0],
	[6, 0, 0, 1, 9, 5, 0, 0, 0],
	[0, 9, 8, 0, 0, 0, 0, 6, 0],
	[8, 0, 0, 0, 6, 0, 0, 0, 3],
	[4, 0, 0, 8, 0, 3, 0, 0, 1],
	[7, 0, 0, 0, 2, 0, 0, 0, 6],
	[0, 6, 0, 0, 0, 0, 2, 8, 0],
	[0, 0, 0, 4, 1, 9, 0, 0, 5],
	[0, 0, 0, 0, 8, 0, 0, 7, 9]
];

export const demoSolution: SudokuBoard = [
	[5, 3, 4, 6, 7, 8, 9, 1, 2],
	[6, 7, 2, 1, 9, 5, 3, 4, 8],
	[1, 9, 8, 3, 4, 2, 5, 6, 7],
	[8, 5, 9, 7, 6, 1, 4, 2, 3],
	[4, 2, 6, 8, 5, 3, 7, 9, 1],
	[7, 1, 3, 9, 2, 4, 8, 5, 6],
	[9, 6, 1, 5, 3, 7, 2, 8, 4],
	[2, 8, 7, 4, 1, 9, 6, 3, 5],
	[3, 4, 5, 2, 8, 6, 1, 7, 9]
];

let wasmReady: Promise<void> | null = null;

async function ensureWasmReady(): Promise<void> {
	if (typeof window === 'undefined') {
		return;
	}

	if (!wasmReady) {
		wasmReady = init().then(() => undefined).catch((error) => {
			wasmReady = null;
			throw error;
		});
	}

	await wasmReady;
}

export function parseGeneratedSudoku(raw: string): SudokuBoard {
	const parsed = JSON.parse(raw) as { puzzle?: Array<Array<number | null>> };
	const puzzle = parsed.puzzle ?? [];
	return puzzle.map((row) => row.map((cell) => cell ?? 0));
}

export async function createPuzzleFromWasm(): Promise<SudokuBoard> {
	if (typeof window === 'undefined') {
		return createPuzzleStub();
	}

	await ensureWasmReady();
	return parseGeneratedSudoku(generate_sudoku());
}

export async function exportPdfFromWasm(pages = 1): Promise<void> {
	if (typeof window === 'undefined') {
		return;
	}

	await ensureWasmReady();
	const pdfBytes = generate_pdf(pages);
	const pdfBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
	const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.target = '_blank';
	anchor.rel = 'noopener noreferrer';
	anchor.click();
	URL.revokeObjectURL(url);
}

export function createPuzzleStub(): SudokuBoard {
	return demoPuzzle.map((row) => [...row]);
}

export function solvePuzzleStub(puzzle: SudokuBoard): SudokuBoard {
	return puzzle.map((row) => [...row]);
}

export function boardToFlat(board: SudokuBoard): number[] {
	return board.flat();
}

export function flatToBoard(flat: number[]): SudokuBoard {
	return Array.from({ length: 9 }, (_, row) =>
		Array.from({ length: 9 }, (_, col) => flat[row * 9 + col] ?? 0)
	);
}
