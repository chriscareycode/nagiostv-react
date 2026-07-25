import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DeferredHistoryChart from './DeferredHistoryChart';

vi.mock('./HistoryChart', () => ({
	default: () => <div>Deferred history chart loaded</div>,
}));

describe('DeferredHistoryChart', () => {
	it('loads the chart component asynchronously', async () => {
		render(
			<DeferredHistoryChart
				alertlist={[]}
				alertlistLastUpdate={0}
				groupBy="day"
				hideAlertSoft={false}
				locale="en-US"
				triggerReflow={0}
			/>,
		);

		expect(await screen.findByText('Deferred history chart loaded')).toBeInTheDocument();
	});
});
