import '@testing-library/jest-dom/vitest';

if (!globalThis.CSS) {
	Object.defineProperty(globalThis, 'CSS', {
		value: {},
		writable: true,
	});
}

if (!globalThis.CSS.supports) {
	globalThis.CSS.supports = () => false;
}

// Node 22+ defines a lazy globalThis.localStorage getter that resolves to undefined unless node
// is run with --localstorage-file. Vitest's jsdom environment only copies jsdom window keys that do
// not already exist on the Node global, so that broken getter shadows jsdom's working localStorage.
// Re-expose jsdom's localStorage on `window` so persistence tests behave like a real browser.
const jsdomWindow = (globalThis as { jsdom?: { window: unknown } }).jsdom?.window as
	| { localStorage?: Storage }
	| undefined;
const windowTarget = globalThis as { window?: { localStorage?: Storage } };
if (windowTarget.window && !windowTarget.window.localStorage && jsdomWindow?.localStorage) {
	Object.defineProperty(windowTarget.window, 'localStorage', {
		value: jsdomWindow.localStorage,
		configurable: true,
		writable: true,
	});
}
