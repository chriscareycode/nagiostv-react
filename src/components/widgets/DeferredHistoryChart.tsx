import { lazy, Suspense } from 'react';
import type { HistoryChartProps } from './HistoryChart';

const HistoryChart = lazy(() => import('./HistoryChart'));

const DeferredHistoryChart = (props: HistoryChartProps) => (
	<Suspense
		fallback={(
			<div
				className="HistoryChart"
				role="status"
				style={{ minHeight: '170px' }}
			>
				Loading chart…
			</div>
		)}
	>
		<HistoryChart {...props} />
	</Suspense>
);

export default DeferredHistoryChart;
