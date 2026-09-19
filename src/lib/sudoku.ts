import init, { generate_pdf, generate_sudoku, solve_sudoku } from 'sudoku-wasm';

export type SudokuBoard = number[][];

export const emptyBoard: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0));

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

export function parseGeneratedSolution(raw: string): SudokuBoard {
	const parsed = JSON.parse(raw) as { solution?: Array<Array<number | null>> };
	const solution = parsed.solution ?? [];
	return solution.map((row) => row.map((cell) => cell ?? 0));
}

let currentSolution: SudokuBoard | null = null;

export function getCurrentSolution(): SudokuBoard | null {
	return currentSolution;
}

export function setCurrentSolution(solution: SudokuBoard | null): void {
	currentSolution = solution;
}

export async function createPuzzleFromWasm(): Promise<SudokuBoard> {
	if (typeof window === 'undefined') {
		return createPuzzleStub();
	}

	await ensureWasmReady();
	const raw = generate_sudoku();
	setCurrentSolution(parseGeneratedSolution(raw));
	return parseGeneratedSudoku(raw);
}

export async function solvePuzzleFromWasm(): Promise<SudokuBoard | null> {
	const solution = getCurrentSolution();
	if (solution) {
		return solution.map((row) => [...row]);
	}
	return null;
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
	return emptyBoard.map((row) => [...row]);
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
