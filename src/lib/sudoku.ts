import init, { generate_pdf, generate_sudoku } from 'sudoku-wasm';

export type SudokuBoard = number[][];
export type SavedSudokuGame = {
	initialPuzzle: number[];
	board: number[];
	notes: Record<number, number[]>;
	solution: number[] | null;
};

export const emptyBoard: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0));

let wasmReady: Promise<void> | null = null;

async function ensureWasmReady(): Promise<void> {
	if (typeof window === 'undefined') {
		return;
	}

	if (!wasmReady) {
		wasmReady = init()
			.then(() => undefined)
			.catch((error) => {
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

export function parseSavedSudokuGame(raw: string): SavedSudokuGame | null {
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object') {
			return null;
		}

		const game = parsed as Partial<SavedSudokuGame>;
		const isFlatBoard = (candidate: unknown): candidate is number[] =>
			Array.isArray(candidate) &&
			candidate.length === 81 &&
			candidate.every((value) => Number.isInteger(value) && value >= 0 && value <= 9);

		if (!isFlatBoard(game.initialPuzzle) || !isFlatBoard(game.board)) {
			return null;
		}
		if (game.solution !== null && !isFlatBoard(game.solution)) {
			return null;
		}
		if (!game.notes || typeof game.notes !== 'object' || Array.isArray(game.notes)) {
			return null;
		}

		const notes: Record<number, number[]> = {};
		for (const [index, values] of Object.entries(game.notes)) {
			const cellIndex = Number(index);
			if (
				!Number.isInteger(cellIndex) ||
				cellIndex < 0 ||
				cellIndex >= 81 ||
				!Array.isArray(values) ||
				!values.every((value) => Number.isInteger(value) && value >= 1 && value <= 9)
			) {
				return null;
			}
			notes[cellIndex] = values;
		}

		return {
			initialPuzzle: game.initialPuzzle,
			board: game.board,
			notes,
			solution: game.solution ?? null
		};
	} catch {
		return null;
	}
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
	const pdfBuffer = pdfBytes.buffer.slice(
		pdfBytes.byteOffset,
		pdfBytes.byteOffset + pdfBytes.byteLength
	) as ArrayBuffer;
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

export function clampPickerPosition({
	x,
	y,
	width,
	height,
	viewportWidth,
	viewportHeight,
	padding = 8
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	viewportWidth: number;
	viewportHeight: number;
	padding?: number;
}): { x: number; y: number } {
	const minX = width / 2 + padding;
	const maxX = Math.max(minX, viewportWidth - width / 2 - padding);
	const minY = height + padding;
	const maxY = Math.max(minY, viewportHeight - padding);

	return {
		x: Math.min(Math.max(x, minX), maxX),
		y: Math.min(Math.max(y, minY), maxY)
	};
}

export function flatToBoard(flat: number[]): SudokuBoard {
	return Array.from({ length: 9 }, (_, row) =>
		Array.from({ length: 9 }, (_, col) => flat[row * 9 + col] ?? 0)
	);
}
