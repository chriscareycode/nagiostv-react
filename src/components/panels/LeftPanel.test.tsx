import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LeftPanel from './LeftPanel';

vi.mock('react-tooltip', () => ({
	Tooltip: ({ className }: { className?: string }) => (
		<div className={className} data-testid="left-panel-tooltip" />
	),
}));

describe('LeftPanel', () => {
	it('exposes tooltips outside the open sliding panel', () => {
		const { container } = render(
			<Provider>
				<MemoryRouter>
					<LeftPanel isLeftPanelOpen />
				</MemoryRouter>
			</Provider>,
		);

		expect(container.querySelector('.LeftPanel')).toHaveClass('left-panel-open');
		expect(screen.getByTestId('left-panel-tooltip')).toHaveClass(
			'left-panel-tooltip',
		);
	});

	it('keeps the closed-panel class separate from the open state', () => {
		const { container } = render(
			<Provider>
				<MemoryRouter>
					<LeftPanel isLeftPanelOpen={false} />
				</MemoryRouter>
			</Provider>,
		);

		expect(container.querySelector('.LeftPanel')).not.toHaveClass(
			'left-panel-open',
		);
	});
});
