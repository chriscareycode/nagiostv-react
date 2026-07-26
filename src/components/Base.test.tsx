import { fireEvent, render, screen } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { describe, expect, it, vi } from 'vitest';
import { bigStateAtom, clientSettingsAtom, clientSettingsInitial } from '../atoms/settingsState';
import Base from './Base';

vi.mock('./SettingsLoad', () => ({ default: () => null }));
vi.mock('./SettingsFakeData', () => ({ default: () => null }));
vi.mock('./Dashboard', () => ({ default: () => <div>Dashboard route content</div> }));
vi.mock('./Settings', () => ({ default: () => <div>Settings route content</div> }));
vi.mock('./Update', () => ({ default: () => <div>Update route content</div> }));
vi.mock('./Help', () => ({ default: () => <div>Help route content</div> }));
vi.mock('./panels/TopPanel', () => ({ default: () => null }));
vi.mock('./panels/LeftPanel', async () => {
	const { Link } = await vi.importActual<typeof import('react-router')>(
		'react-router',
	);
	return {
		default: () => <Link to="/help">Test help navigation</Link>,
	};
});
vi.mock('./panels/BottomPanel', () => ({ default: () => null }));
vi.mock('./widgets/MiniMapWrap', () => ({
	default: ({ children }: { children: React.ReactNode }) => (
		<div>
			<span>Deferred minimap loaded</span>
			{children}
		</div>
	),
}));
vi.mock('./widgets/ScrollToTop', () => ({ default: () => null }));
vi.mock('./widgets/ScrollToSection', () => ({ default: () => null }));

const renderBase = (path: string, showMiniMap = false) => {
	const store = createStore();
	store.set(bigStateAtom, {
		...store.get(bigStateAtom),
		isDoneLoading: true,
	});
	store.set(clientSettingsAtom, {
		...clientSettingsInitial,
		showMiniMap,
	});
	window.location.hash = `#${path}`;

	return render(
		<Provider store={store}>
			<Base />
		</Provider>,
	);
};

describe('Base routes', () => {
	it.each([
		['/settings', 'Settings route content'],
		['/update', 'Update route content'],
		['/help', 'Help route content'],
	])('loads the %s route asynchronously', async (path, content) => {
		renderBase(path);

		expect(await screen.findByText(content)).toBeInTheDocument();
	});

	it('loads the minimap wrapper only when enabled', async () => {
		renderBase('/', true);

		expect(await screen.findByText('Deferred minimap loaded')).toBeInTheDocument();
		expect(screen.getByText('Dashboard route content')).toBeInTheDocument();
	});

	it('supports direct hash routes with query parameters', async () => {
		renderBase('/settings?alertSearch=database');

		expect(await screen.findByText('Settings route content')).toBeInTheDocument();
		expect(window.location.hash).toBe('#/settings?alertSearch=database');
	});

	it('navigates between hash routes using router links', async () => {
		renderBase('/');

		fireEvent.click(screen.getByRole('link', { name: 'Test help navigation' }));

		expect(await screen.findByText('Help route content')).toBeInTheDocument();
		expect(window.location.hash).toBe('#/help');
	});
});
