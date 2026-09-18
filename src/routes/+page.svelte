<script lang="ts">
	import { boardToFlat, createPuzzleStub, demoSolution, flatToBoard, type SudokuBoard } from '$lib/sudoku';

	const initialPuzzle = createPuzzleStub();
	const initialFlat = boardToFlat(initialPuzzle);

	let board = $state<number[]>([...initialFlat]);
	let selectedIndex = $state<number | null>(null);
	let showNumberPicker = $state(false);
	let pickerPosition = $state({ x: 0, y: 0 });
	let commentMode = $state(false);
	let hintsEnabled = $state(true);
	let notes = $state<Record<number, number[]>>({});
	let highlightedValue = $state<number | null>(null);

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

		if (commentMode) {
			if (value === null) {
				const nextNotes = { ...notes };
				delete nextNotes[selectedIndex];
				notes = nextNotes;
				showNumberPicker = false;
				highlightedValue = null;
				return;
			}

			const current = notes[selectedIndex] ?? [];
			const nextNotes = current.includes(value)
				? current.filter((num) => num !== value)
				: [...current, value].sort((a, b) => a - b);
			notes = { ...notes, [selectedIndex]: nextNotes };
			if (board[selectedIndex] !== 0) {
				const next = [...board];
				next[selectedIndex] = 0;
				board = next;
			}
			showNumberPicker = false;
			highlightedValue = value;
			return;
		}

		const next = [...board];
		next[selectedIndex] = value ?? 0;
		board = next;
		const nextNotes = { ...notes };
		delete nextNotes[selectedIndex];
		notes = nextNotes;
		showNumberPicker = false;
		highlightedValue = value ?? null;
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
		notes = {};
		selectedIndex = null;
		showNumberPicker = false;
		commentMode = false;
		highlightedValue = null;
	}

	// Dummy export handler (implement later)
	function exportPdf(): void {
		// TODO: implement PDF export
		console.log('exportPdf called — TODO: implement');
	}

	function openNumberPicker(index: number, event?: MouseEvent) {
		selectedIndex = index;
		highlightedValue = board[index] !== 0 ? board[index] : null;
		showNumberPicker = !isFixedCell(index) && !showNumberPicker;

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
		notes = {};
		selectedIndex = null;
		showNumberPicker = false;
		commentMode = false;
		highlightedValue = null;
	}

	function solveBoardStub() {
		const solved = demoSolution;
		board = boardToFlat(solved);
		notes = {};
		selectedIndex = null;
		showNumberPicker = false;
		commentMode = false;
		highlightedValue = null;
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
		const isHighlighted = highlightedValue !== null && board[index] === highlightedValue;
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
			isHighlighted ? 'same-value' : '',
			isRowMatch || isColMatch || isBoxMatch ? 'related' : '',
			row === 2 || row === 5 ? 'heavy-bottom' : '',
			col === 2 || col === 5 ? 'heavy-right' : ''
		].join(' ');
	}

	function toggleCommentMode() {
		commentMode = !commentMode;
	}

	function cellNotes(index: number) {
		return notes[index] ?? [];
	}

	function blockedDigitsForCell(targetIndex: number) {
		const blocked = new Set<number>();
		if (targetIndex < 0 || targetIndex >= board.length) {
			return blocked;
		}

		const row = Math.floor(targetIndex / 9);
		const col = targetIndex % 9;

		for (let index = 0; index < board.length; index += 1) {
			const value = board[index];
			if (value === 0 || index === targetIndex) {
				continue;
			}

			const checkRow = Math.floor(index / 9);
			const checkCol = index % 9;
			const sameRow = checkRow === row;
			const sameCol = checkCol === col;
			const sameBox = Math.floor(checkRow / 3) === Math.floor(row / 3) && Math.floor(checkCol / 3) === Math.floor(col / 3);

			if (sameRow || sameCol || sameBox) {
				blocked.add(value);
			}
		}

		return blocked;
	}

	function visibleCellNotes(index: number) {
		if (!hintsEnabled) {
			return cellNotes(index);
		}
		const blocked = blockedDigitsForCell(index);
		return cellNotes(index).filter((note) => !blocked.has(note));
	}

	function selectedNotesForCell() {
		if (selectedIndex === null) {
			return new Set<number>();
		}
		return new Set(cellNotes(selectedIndex));
	}

	function closeNumberPicker() {
		showNumberPicker = false;
		highlightedValue = null;
	}
</script>

<svelte:head>
	<title>Sudoku</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0,0"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window onkeydown={handleKeydown} onmousedown={(event) => {
	if (!showNumberPicker) {
		return;
	}

	const target = event.target as HTMLElement | null;
	if (!target) {
		closeNumberPicker();
		return;
	}

	const picker = document.querySelector('.number-picker');
	if (picker && !picker.contains(target)) {
		closeNumberPicker();
	}
}} />

<div class="page-shell">
	<header class="hero">
		<p class="eyebrow">Play anywhere</p>
		<h1>SUDOKU</h1>
		<div class="header-actions">
			<span class="header-label">Printable Version</span>
			<button class="ghost export-btn" type="button" onclick={exportPdf}>Export PDF</button>
		</div>
	</header>

	<section class="toolbar" aria-label="Sudoku controls">
		<button class="ghost" type="button" onclick={resetBoard}>Reset</button>
		<button class="ghost" type="button" onclick={generatePuzzleStub}>New puzzle</button>
		<button class="primary" type="button" onclick={solveBoardStub}>Solve</button>
		<label class="toggle" aria-label="Toggle hints">
			<span>Hints</span>
			<input type="checkbox" bind:checked={hintsEnabled} />
			<span class="toggle-track"><span class="toggle-thumb" /></span>
		</label>
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
						{#if value !== 0}
							<span class="cell-value">{value}</span>
						{:else if visibleCellNotes(index).length > 0}
							<div class="cell-notes" aria-label="Cell notes">
								{#each visibleCellNotes(index) as note}
									<span>{note}</span>
								{/each}
							</div>
						{/if}
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
					{@const isSelectedNote = selectedNotesForCell().has(digit)}
					{@const isBlocked = hintsEnabled && selectedIndex !== null && blockedDigitsForCell(selectedIndex).has(digit)}
					<button
						type="button"
						class={`picker-digit${isSelectedNote ? ' note-selected' : ''}${isBlocked ? ' blocked' : ''}`}
						disabled={isBlocked && !isSelectedNote}
						onclick={() => setCellValue(digit)}
					>
						<span class="picker-number">{digit}</span>
						{#if isBlocked}
							<span class="picker-blocked-icon material-symbols-rounded">block</span>
						{/if}
						{#if commentMode}
							<span class="picker-note-icon material-symbols-rounded">edit</span>
						{/if}
					</button>
				{/each}
			</div>
			<div class="picker-actions" aria-label="Quick actions">
				<button type="button" class="action-btn close-btn" aria-label="Close" onclick={() => (showNumberPicker = false)}>
					<span class="material-symbols-rounded">close</span>
				</button>
				<button type="button" class="action-btn clear-btn" aria-label="Clear cell" onclick={() => setCellValue(null)}>
					<span class="material-symbols-rounded">backspace</span>
				</button>
				<button
					type="button"
					class={`action-btn note-btn${commentMode ? ' active' : ''}`}
					aria-label="Toggle notes"
					onclick={() => {
						toggleCommentMode();
					}}
				>
					<span class="material-symbols-rounded">edit_note</span>
				</button>
			</div>
		</div>
	{/if}

	<div class="keypad" aria-label="Number pad">
		{#each digits as digit}
			<button type="button" class="digit" onclick={() => setCellValue(digit)}>
				<span>{digit}</span>
				{#if commentMode}
					<span class="digit-note-icon material-symbols-rounded">edit</span>
				{/if}
			</button>
		{/each}
		<button type="button" class="digit clear" onclick={() => setCellValue(null)}>Clear</button>
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

	.export-btn {
		border-radius: 999px;
		padding: 0.45rem 0.75rem;
		font-weight: 700;
		cursor: pointer;
		background: rgba(255, 255, 255, 0.7);
		color: #0f172a;
		border: 1px solid rgba(15, 23, 42, 0.12);
		font-size: 0.85rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(3.25rem, 10vw, 7rem);
		line-height: 0.9;
		letter-spacing: 0.08em;
		font-weight: 900;
	}

	.header-actions {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
	}

	.header-label {
		font-size: 0.95rem;
		color: #475569;
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

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 0.45rem 0.8rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(15, 23, 42, 0.12);
		font-weight: 700;
		color: #0f172a;
		cursor: pointer;
	}

	.toggle input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.toggle-track {
		position: relative;
		display: inline-block;
		width: 38px;
		height: 22px;
		border-radius: 999px;
		background: #cbd5e1;
		transition: background-color 0.2s ease;
	}

	.toggle-thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 14px;
		height: 14px;
		border-radius: 999px;
		background: white;
		transition: transform 0.2s ease;
	}

	.toggle input:checked + .toggle-track {
		background: #60a5fa;
	}

	.toggle input:checked + .toggle-track .toggle-thumb {
		transform: translateX(16px);
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
		position: relative;
		overflow: hidden;
	}

	.cell-value {
		display: block;
		line-height: 1;
	}

	.cell-notes {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-template-rows: repeat(3, minmax(0, 1fr));
		gap: 1px;
		width: 100%;
		height: 100%;
		padding: 0px;
		font-size: 0.7rem;
		line-height: 50%;
		font-weight: 700;
		color: #94a3b8;
		text-align: center;
		align-items: center;
		justify-items: center;
	}

	.cell-notes span {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-size: 0.7rem;
		white-space: nowrap;
		overflow: hidden;
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

	.cell.same-value {
		background: #fdf2d7;
		box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.22);
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
		font-size: 1.15rem;
		font-weight: 800;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.picker-digit.note-selected {
		background: #dbeafe;
		border-color: #93c5fd;
		box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.25);
	}

	.picker-digit.blocked {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.picker-blocked-icon.material-symbols-rounded {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 1.8rem;
		line-height: 1;
		color: rgba(15, 23, 42, 0.72);
		pointer-events: none;
		z-index: 2;
		font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;
	}

	.picker-number {
		display: inline-block;
		line-height: 1;
		position: relative;
		z-index: 1;
	}

	.picker-note-icon {
		position: absolute;
		top: 3px;
		right: 3px;
		font-size: 0.8rem;
		line-height: 1;
		color: #64748b;
		pointer-events: none;
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.close-btn {
		background: transparent;
		border-color: transparent;
	}

	.clear-btn {
		background: #e2e8f0;
	}

	.note-btn {
		background: #dbeafe;
	}

	.note-btn.active {
		background: #bfdbfe;
		border-color: #60a5fa;
		box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.5);
	}

	.material-symbols-rounded {
		font-family: 'Material Symbols Rounded';
		font-size: 1.1rem;
		font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
		line-height: 1;
		display: inline-block;
	}

	.material-symbols-rounded.picker-note-icon,
	.material-symbols-rounded.digit-note-icon {
		font-size: 0.8rem;
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.digit-note-icon {
		font-size: 0.7rem;
		line-height: 1;
		color: #64748b;
		transform: translateY(1px);
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

	/* Remove borders from interactive buttons for consistent appearance */
	.ghost,
	.export-btn,
	.picker-digit,
	.action-btn,
	.digit,
	.primary,
	.toggle {
		border: none !important;
	}
</style>
