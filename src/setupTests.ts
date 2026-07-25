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
