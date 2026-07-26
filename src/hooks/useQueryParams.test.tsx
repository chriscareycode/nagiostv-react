import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useQueryParams } from './useQueryParams';

const wrapper = ({ children }: { children: ReactNode }) => (
	<MemoryRouter initialEntries={['/?existing=value']}>
		{children}
	</MemoryRouter>
);

const useQueryParamsWithLocation = () => ({
	location: useLocation(),
	queryParams: useQueryParams(),
});

describe('useQueryParams with React Router v7', () => {
	it('reads, updates, and removes query parameters without losing others', () => {
		const { result } = renderHook(useQueryParamsWithLocation, { wrapper });

		expect(result.current.queryParams.get('existing')).toBe('value');

		act(() => {
			result.current.queryParams.set({ alertSearch: 'database errors' });
		});
		expect(new URLSearchParams(result.current.location.search).get('alertSearch'))
			.toBe('database errors');
		expect(new URLSearchParams(result.current.location.search).get('existing'))
			.toBe('value');

		act(() => {
			result.current.queryParams.remove('existing');
		});
		expect(new URLSearchParams(result.current.location.search).get('alertSearch'))
			.toBe('database errors');
		expect(new URLSearchParams(result.current.location.search).has('existing'))
			.toBe(false);
	});
});
