import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MonitoringItems from './MonitoringItems';

interface TestItem {
	id: string;
}

const renderList = (
	items: TestItem[],
	filteredItems: TestItem[],
	totalCount: number,
) => render(
	<MonitoringItems
		allHealthyMessage="hosts are UP"
		className="HostItems ServiceItems"
		filteredItems={filteredItems}
		getKey={item => item.id}
		itemClassName="HostItem"
		items={items}
		itemsWrapClassName="host-items-wrap"
		language="English"
		renderItem={(item, problemCount) => (
			<span>{item.id}:{problemCount}</span>
		)}
		totalCount={totalCount}
		type="host"
	/>,
);

describe('MonitoringItems', () => {
	it('shows the all-healthy message when there are no problem items', () => {
		renderList([], [], 4);

		expect(screen.getByText(/All 4 hosts are UP/)).toBeInTheDocument();
	});

	it('shows healthy and hidden counts when every problem is filtered out', () => {
		const { container } = renderList(
			[{ id: 'one' }, { id: 'two' }],
			[],
			5,
		);

		expect(screen.getByText(/3 of 5 hosts are UP/)).toBeInTheDocument();
		expect(screen.getByText('2 hidden')).toBeInTheDocument();
		expect(container.querySelector('.some-down-items')).toHaveClass('visible');
	});

	it('renders only filtered rows and passes their count to the row renderer', () => {
		renderList(
			[{ id: 'one' }, { id: 'two' }],
			[{ id: 'two' }],
			5,
		);

		expect(screen.getByText('two:1')).toBeInTheDocument();
		expect(screen.queryByText('one:1')).not.toBeInTheDocument();
	});
});
