import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MonitoringError from './MonitoringError';

const defaultProps = {
	error: true,
	errorCount: 1,
	errorMessage: 'Unable to fetch monitoring data',
	isDemoMode: false,
	itemCount: 4,
};

describe('MonitoringError', () => {
	it('hides transient errors while existing data is available', () => {
		render(<MonitoringError {...defaultProps} />);

		expect(screen.queryByRole('img', { name: 'error' })).not.toBeInTheDocument();
	});

	it('shows errors immediately when no existing data is available', () => {
		render(<MonitoringError {...defaultProps} itemCount={0} />);

		expect(screen.getByText(defaultProps.errorMessage)).toBeInTheDocument();
	});

	it('shows repeated errors even when existing data is available', () => {
		render(<MonitoringError {...defaultProps} errorCount={3} />);

		expect(screen.getByText(defaultProps.errorMessage)).toBeInTheDocument();
	});

	it('hides errors in demo mode', () => {
		render(<MonitoringError {...defaultProps} errorCount={3} isDemoMode />);

		expect(screen.queryByText(defaultProps.errorMessage)).not.toBeInTheDocument();
	});
});
