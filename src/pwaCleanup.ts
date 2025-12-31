/**
 * Best-effort cleanup for clients that previously had the PWA enabled.
 *
 * What this does:
 * - Unregisters all Service Workers for this origin
 * - Removes caches created by SW/workbox
 * - Attempts to remove the app's Web Push subscription (if present)
 *
 * This is safe to run repeatedly.
 */
export async function disablePwaOnClient(opts?: { verbose?: boolean }) {
	const verbose = Boolean(opts?.verbose);
	const log = (...args: unknown[]) => {
		if (verbose) console.log('[pwa-cleanup]', ...args);
	};

	// No SW support => nothing to do.
	if (!('serviceWorker' in navigator)) return;

	try {
		const regs = await navigator.serviceWorker.getRegistrations();
		if (regs.length) log('found service worker registrations:', regs.length);

		await Promise.all(
			regs.map(async (reg) => {
				try {
					await reg.unregister();
					log('unregistered a service worker');
				} catch (e) {
					log('failed to unregister service worker', e);
				}
			})
		);
	} catch (e) {
		log('failed to query service worker registrations', e);
	}

	// Clear caches created by SW/workbox. Some browsers can throw if blocked by policy.
	try {
		if ('caches' in window) {
			const names = await caches.keys();
			if (names.length) log('found caches:', names);
			await Promise.all(
				names.map(async (name) => {
					try {
						await caches.delete(name);
						log('deleted cache', name);
					} catch (e) {
						log('failed to delete cache', name, e);
					}
				})
			);
		}
	} catch (e) {
		log('cache cleanup failed', e);
	}

	// If web-push was ever used, try to unsubscribe.
	try {
		if ('PushManager' in window) {
			const reg = await navigator.serviceWorker.getRegistration();
			const sub = await reg?.pushManager?.getSubscription();
			if (sub) {
				await sub.unsubscribe();
				log('unsubscribed push subscription');
			}
		}
	} catch (e) {
		log('push subscription cleanup failed (safe to ignore)', e);
	}
}
