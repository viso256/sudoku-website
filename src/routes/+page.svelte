<script lang="ts">
	import { boardToFlat, createPuzzleStub, demoSolution, flatToBoard, type SudokuBoard } from '$lib/sudoku';

	const initialPuzzle = createPuzzleStub();
	const initialFlat = boardToFlat(initialPuzzle);

	let board = $state<number[]>([...initialFlat]);
	let selectedIndex = $state<number | null>(null);
	let showNumberPicker = $state(false);
	let pickerPosition = $state({ x: 0, y: 0 });

	const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

	function isFixedCell(index: number) {
		return initialFlat[index] !== 0;
	}

	function setCellValue(value: number | null) {
		if (selectedIndex === null) {
			return;
		}

		if (isFixedCell(selectedIndex)) {
			return;
		}

		const next = [...board];
		next[selectedIndex] = value ?? 0;
		board = next;
		showNumberPicker = false;
	}

	function moveSelection(deltaRow: number, deltaCol: number) {
		if (selectedIndex === null) {
			selectedIndex = 0;
			return;
		}

		const row = Math.floor(selectedIndex / 9);
		const col = selectedIndex % 9;
		const nextRow = Math.min(8, Math.max(0, row + deltaRow));
		const nextCol = Math.min(8, Math.max(0, col + deltaCol));
		selectedIndex = nextRow * 9 + nextCol;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (selectedIndex === null) {
			return;
		}

		if (/^[1-9]$/.test(event.key)) {
			setCellValue(Number(event.key));
			event.preventDefault();
			return;
		}

		if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
			setCellValue(null);
			event.preventDefault();
			return;
		}

		if (event.key === 'ArrowUp') {
			moveSelection(-1, 0);
			event.preventDefault();
		}
		if (event.key === 'ArrowDown') {
			moveSelection(1, 0);
			event.preventDefault();
		}
		if (event.key === 'ArrowLeft') {
			moveSelection(0, -1);
			event.preventDefault();
		}
		if (event.key === 'ArrowRight') {
			moveSelection(0, 1);
			event.preventDefault();
		}
	}

	function resetBoard() {
		board = [...initialFlat];
		selectedIndex = null;
		showNumberPicker = false;
	}

	function openNumberPicker(index: number, event?: MouseEvent) {
		if (isFixedCell(index)) {
			return;
		}

		selectedIndex = index;
		showNumberPicker = true;

		if (event) {
			const target = event.currentTarget as HTMLElement | null;
			const rect = target?.getBoundingClientRect();

			pickerPosition = {
				x: rect ? rect.left + rect.width / 2 : event.clientX,
				y: rect ? rect.top - 8 : event.clientY - 8
			};
		}
	}

	function generatePuzzleStub() {
		const next = createPuzzleStub();
		board = boardToFlat(next);
		selectedIndex = null;
		showNumberPicker = false;
	}

	function solveBoardStub() {
		const solved = demoSolution;
		board = boardToFlat(solved);
		selectedIndex = null;
		showNumberPicker = false;
	}

	function isSameRowOrColumn(index: number) {
		if (selectedIndex === null) {
			return false;
		}
		return Math.floor(index / 9) === Math.floor(selectedIndex / 9) || index % 9 === selectedIndex % 9;
	}

	function cellClass(index: number) {
		const row = Math.floor(index / 9);
		const col = index % 9;
		const isSelected = selectedIndex === index;
		const isFixed = isFixedCell(index);
		const isRowMatch = selectedIndex !== null && Math.floor(selectedIndex / 9) === row;
		const isColMatch = selectedIndex !== null && selectedIndex % 9 === col;
		const isBoxMatch =
			selectedIndex !== null &&
			Math.floor(selectedIndex / 9 / 3) === Math.floor(row / 3) &&
			Math.floor(selectedIndex % 9 / 3) === Math.floor(col / 3);

		return [
			'cell',
			isSelected ? 'selected' : '',
			isFixed ? 'fixed' : 'editable',
			isRowMatch || isColMatch || isBoxMatch ? 'related' : '',
			row === 2 || row === 5 ? 'heavy-bottom' : '',
			col === 2 || col === 5 ? 'heavy-right' : ''
		].join(' ');
	}
</script>

<svelte:head>
	<title>Sudoku</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="page-shell">
	<header class="hero">
		<p class="eyebrow">Play anywhere</p>
		<h1>SUDOKU</h1>
		<p class="subtitle">Big, readable puzzle layout built for desktop and mobile.</p>
	</header>

	<section class="toolbar" aria-label="Sudoku controls">
		<button class="ghost" type="button" onclick={resetBoard}>Reset</button>
		<button class="ghost" type="button" onclick={generatePuzzleStub}>New puzzle</button>
		<button class="primary" type="button" onclick={solveBoardStub}>Solve</button>
	</section>

	<div class="board-layout">
		<div class="board-frame">
			<div class="board" role="grid" aria-label="9 by 9 Sudoku board">
				{#each board as value, index}
					<button
						type="button"
						class={cellClass(index)}
						onclick={(event) => {
							openNumberPicker(index, event);
						}}
						aria-label={`Row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}`}
					>
						{value === 0 ? '' : value}
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if showNumberPicker && selectedIndex !== null && !isFixedCell(selectedIndex)}
		<div
			class="number-picker"
			role="dialog"
			aria-label="Choose a number"
			style={`left:${pickerPosition.x}px; top:${pickerPosition.y}px;`}
		>
			<div class="number-grid">
				{#each digits as digit}
					<button type="button" class="picker-digit" onclick={() => setCellValue(digit)}>{digit}</button>
				{/each}
			</div>
			<div class="picker-actions" aria-label="Quick actions">
				<button type="button" class="action-btn close-btn" aria-label="Close" onclick={() => (showNumberPicker = false)}>×</button>
				<button type="button" class="action-btn clear-btn" aria-label="Clear cell" onclick={() => setCellValue(null)}>🧹</button>
				<button type="button" class="action-btn note-btn" aria-label="Mark or note" onclick={() => (showNumberPicker = false)}>✎</button>
			</div>
		</div>
	{/if}

	<div class="keypad" aria-label="Number pad">
		{#each digits as digit}
			<button type="button" class="digit" onclick={() => setCellValue(digit)}>{digit}</button>
		{/each}
		<button type="button" class="digit clear" onclick={() => setCellValue(null)}>Clear</button>
	</div>

	<div class="note">
		<p>Generator and solver placeholders are ready for the later WASM integration.</p>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		min-height: 100vh;
		font-family: 'Segoe UI', sans-serif;
		background: radial-gradient(circle at top, #f8fafc 0%, #e2e8f0 45%, #cbd5e1 100%);
		color: #0f172a;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.page-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px 16px 56px;
	}

	.hero {
		text-align: center;
		margin-bottom: 16px;
	}

	.eyebrow {
		margin: 0 0 6px;
		font-size: 0.8rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #475569;
	}

	h1 {
		margin: 0;
		font-size: clamp(3.25rem, 10vw, 7rem);
		line-height: 0.9;
		letter-spacing: 0.08em;
		font-weight: 900;
	}

	.subtitle {
		margin: 12px auto 0;
		max-width: 48rem;
		font-size: clamp(0.95rem, 2vw, 1.25rem);
		color: #334155;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
		margin: 18px 0 24px;
	}

	button {
		font: inherit;
	}

	.toolbar button {
		border: 0;
		border-radius: 999px;
		padding: 0.8rem 1.2rem;
		font-weight: 700;
		cursor: pointer;
	}

	.primary {
		background: linear-gradient(135deg, #2563eb, #1d4ed8);
		color: white;
		box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
	}

	.ghost {
		background: rgba(255, 255, 255, 0.7);
		color: #0f172a;
		border: 1px solid rgba(15, 23, 42, 0.12);
	}

	.board-layout {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 18px;
		width: 100%;
	}

	.board-frame {
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(9, minmax(0, 1fr));
		width: min(90vw, 760px);
		aspect-ratio: 1 / 1;
		background: #f8fafc;
		border: 4px solid #0f172a;
		box-shadow: 0 28px 60px rgba(15, 23, 42, 0.18);
		overflow: hidden;
	}

	.number-picker {
		display: none;
		position: fixed;
		z-index: 20;
	}

	.cell {
		appearance: none;
		border: 1px solid #cbd5e1;
		background: #fff;
		color: #0f172a;
		font-size: clamp(1.25rem, 2.8vw, 2.8rem);
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		cursor: pointer;
		transition: background-color 0.15s ease, transform 0.15s ease;
	}

	.cell:hover {
		background: #f8fafc;
	}

	.cell.fixed {
		background: #e2e8f0;
		color: #0f172a;
	}

	.cell.editable {
		background: #ffffff;
		color: #1d4ed8;
	}

	.cell.selected {
		background: #dbeafe;
		outline: 3px solid #60a5fa;
		z-index: 2;
	}

	.cell.related {
		background: #eff6ff;
	}

	.cell.heavy-right {
		border-right: 3px solid #0f172a;
	}

	.cell.heavy-bottom {
		border-bottom: 3px solid #0f172a;
	}

	.keypad {
		display: none;
	}

	.number-picker {
		display: flex;
		align-items: stretch;
		gap: 8px;
		width: min(58vw, 210px);
		padding: 8px;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.96);
		box-shadow: 0 16px 32px rgba(15, 23, 42, 0.18);
		position: fixed;
		transform: translate(-50%, -100%);
	}

	.number-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 6px;
		flex: 1;
	}

	.picker-digit {
		appearance: none;
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: 10px;
		background: white;
		padding: 0.52rem 0.2rem;
		font-size: 1rem;
		font-weight: 800;
		cursor: pointer;
	}

	.picker-actions {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 6px;
	}

	.action-btn {
		appearance: none;
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: 10px;
		background: #f8fafc;
		font-size: 1rem;
		font-weight: 700;
		width: 36px;
		height: 36px;
		cursor: pointer;
	}

	.close-btn {
		background: #f1f5f9;
	}

	.clear-btn {
		background: #e2e8f0;
	}

	.note-btn {
		background: #dbeafe;
	}

	.digit {
		appearance: none;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: rgba(255, 255, 255, 0.85);
		border-radius: 16px;
		padding: 0.9rem 0.5rem;
		font-size: clamp(1.15rem, 3vw, 1.8rem);
		font-weight: 800;
		cursor: pointer;
	}

	.clear {
		grid-column: span 2;
		background: #e2e8f0;
	}

	.note {
		margin-top: 18px;
		padding: 0.8rem 1rem;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.6);
		text-align: center;
		color: #475569;
		font-size: 0.95rem;
		max-width: 48rem;
	}

	.note p {
		margin: 0;
	}

	@media (min-width: 900px) {
		.board-layout {
			gap: 20px;
			align-items: center;
		}

		.board {
			width: min(52vmin, 48vw, 500px);
			height: min(52vmin, 48vw, 500px);
			max-width: 500px;
			max-height: 500px;
		}
	}

	@media (max-width: 640px) {
		.page-shell {
			padding-top: 18px;
		}

		.toolbar {
			width: min(90vw, 460px);
		}

		.toolbar button {
			flex: 1 1 140px;
		}
	}
</style>
