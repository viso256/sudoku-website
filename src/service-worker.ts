/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { base, build, files, prerendered, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE_PREFIX = 'sudoku-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}${version}`;
const OFFLINE_PAGE = `${base || ''}/`;
const PRECACHE_URLS = [...new Set([...build, ...files, ...prerendered])];

worker.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
						.map((key) => caches.delete(key))
				)
			)
			.then(() => worker.clients.claim())
	);
});

worker.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') {
		return;
	}

	const url = new URL(request.url);
	if (url.origin !== worker.location.origin) {
		return;
	}

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE_NAME);

			if (request.mode === 'navigate') {
				try {
					const response = await fetch(request);
					if (response.ok) {
						await cache.put(request, response.clone());
					}
					return response;
				} catch {
					return (
						(await cache.match(request)) ?? (await cache.match(OFFLINE_PAGE)) ?? Response.error()
					);
				}
			}

			const cached = await cache.match(request);
			if (cached) {
				return cached;
			}

			const response = await fetch(request);
			if (response.ok && response.type === 'basic') {
				await cache.put(request, response.clone());
			}
			return response;
		})()
	);
});
