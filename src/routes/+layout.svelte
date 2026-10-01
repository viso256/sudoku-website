<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/pwa-icon.svg" type="image/svg+xml" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#162c3a" />
</svelte:head>

{@render children()}
