import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientSettingsInitial } from '../../atoms/settingsState';
import { Alert } from '../../types/hostAndServiceTypes';
import AlertItems from './AlertItems';

let alertSearchText = '';

vi.mock('../../hooks/useQueryParams', () => ({
	useQueryParams: () => ({
		get: () => alertSearchText,
	}),
}));

vi.mock('./QuietFor', () => ({
	default: ({ prevtime }: { prevtime: number }) => (
		<div data-testid="quiet-for" data-prevtime={prevtime} />
	),
}));

vi.mock('./AlertItem', () => ({
	default: ({ e, prevtime }: { e: Alert; prevtime: number }) => (
		<div data-testid="alert-item" data-prevtime={prevtime}>
			{e.name}
		</div>
	),
}));

const makeAlert = (
	name: string,
	timestamp: number,
	stateType = 1,
): Alert => ({
	name,
	host_name: name,
	timestamp,
	state: 2,
	state_type: stateType,
	description: '',
	plugin_output: '',
	object_type: 1,
});

describe('AlertItems', () => {
	beforeEach(() => {
		alertSearchText = '';
	});

	it('uses filtered entries for quiet-period timestamps', () => {
		alertSearchText = 'keep';
		const alerts = [
			makeAlert('hidden-newest', 3_000),
			makeAlert('keep-first', 2_000),
			makeAlert('hidden-middle', 1_500),
			makeAlert('keep-second', 1_000),
		];

		render(
			<AlertItems
				items={alerts}
				settings={clientSettingsInitial}
				isDemoMode={false}
			/>,
		);

		expect(screen.getByTestId('quiet-for')).toHaveAttribute('data-prevtime', '2000');
		const renderedAlerts = screen.getAllByTestId('alert-item');
		expect(renderedAlerts).toHaveLength(2);
		expect(renderedAlerts[1]).toHaveAttribute('data-prevtime', '2000');
	});

	it('does not render an initial quiet period when filters remove every alert', () => {
		alertSearchText = 'no-match';

		render(
			<AlertItems
				items={[makeAlert('host', 1_000)]}
				settings={clientSettingsInitial}
				isDemoMode={false}
			/>,
		);

		expect(screen.queryByTestId('quiet-for')).not.toBeInTheDocument();
	});

	it('bases pagination controls on the filtered result count', () => {
		alertSearchText = 'keep';
		const alerts = [
			...Array.from(
				{ length: 101 },
				(_, index) => makeAlert(`keep-${index}`, 10_000 - index),
			),
			...Array.from(
				{ length: 50 },
				(_, index) => makeAlert(`hidden-${index}`, 5_000 - index),
			),
		];
		const { rerender } = render(
			<AlertItems
				items={alerts}
				settings={clientSettingsInitial}
				isDemoMode={false}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'show more' }));
		expect(screen.getAllByTestId('alert-item')).toHaveLength(101);
		expect(screen.queryByRole('button', { name: 'show more' })).not.toBeInTheDocument();

		alertSearchText = 'hidden';
		rerender(
			<AlertItems
				items={alerts}
				settings={clientSettingsInitial}
				isDemoMode={false}
			/>,
		);
		expect(screen.queryByRole('button', { name: 'show more' })).not.toBeInTheDocument();
	});

	it('excludes soft alerts before calculating adjacent timestamps', () => {
		const settings = {
			...clientSettingsInitial,
			hideAlertSoft: true,
		};

		render(
			<AlertItems
				items={[
					makeAlert('hard-newest', 3_000),
					makeAlert('soft-middle', 2_000, 2),
					makeAlert('hard-oldest', 1_000),
				]}
				settings={settings}
				isDemoMode={false}
			/>,
		);

		const renderedAlerts = screen.getAllByTestId('alert-item');
		expect(renderedAlerts).toHaveLength(2);
		expect(renderedAlerts[1]).toHaveAttribute('data-prevtime', '3000');
	});
});
