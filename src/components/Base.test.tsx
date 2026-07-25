import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Base from './Base';

vi.mock('./SettingsLoad', () => ({ default: () => null }));
vi.mock('./SettingsFakeData', () => ({ default: () => null }));
vi.mock('./Dashboard', () => ({ default: () => <div>Dashboard route content</div> }));
vi.mock('./Settings', () => ({ default: () => <div>Settings route content</div> }));
vi.mock('./Update', () => ({ default: () => <div>Update route content</div> }));
vi.mock('./Help', () => ({ default: () => <div>Help route content</div> }));
vi.mock('./panels/TopPanel', () => ({ default: () => null }));
vi.mock('./panels/LeftPanel', () => ({ default: () => null }));
vi.mock('./panels/BottomPanel', () => ({ default: () => null }));
vi.mock('./widgets/MiniMapWrap', () => ({
	default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('./widgets/ScrollToTop', () => ({ default: () => null }));
vi.mock('./widgets/ScrollToSection', () => ({ default: () => null }));

describe('Base routes', () => {
	it.each([
		['/settings', 'Settings route content'],
		['/update', 'Update route content'],
		['/help', 'Help route content'],
	])('loads the %s route asynchronously', async (path, content) => {
		window.location.hash = `#${path}`;

		render(<Base />);

		expect(await screen.findByText(content)).toBeInTheDocument();
	});
});
