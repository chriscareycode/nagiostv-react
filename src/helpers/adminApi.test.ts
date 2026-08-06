import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAdminCapabilities, postAdminJson } from './adminApi';

const axiosMocks = vi.hoisted(() => ({
	get: vi.fn(),
	post: vi.fn(),
}));

vi.mock('axios', () => ({
	default: axiosMocks,
}));

beforeEach(() => {
	axiosMocks.get.mockReset();
	axiosMocks.post.mockReset();
});

describe('administrative API transport', () => {
	it('loads a session-backed CSRF capability token without credentials', async () => {
		axiosMocks.get.mockResolvedValue({
			data: { enabled: true, csrfToken: 'csrf-token', httpsRequired: false },
		});

		await expect(fetchAdminCapabilities('admin.php')).resolves.toMatchObject({
			csrfToken: 'csrf-token',
		});
		expect(axiosMocks.get).toHaveBeenCalledWith(
			'admin.php?capabilities=true',
			expect.objectContaining({ timeout: 10_000 }),
		);
	});

	it('sends mutation credentials in headers rather than the body', async () => {
		axiosMocks.post.mockResolvedValue({ data: { saved: true } });
		const payload = { titleString: 'Dashboard' };

		await postAdminJson('admin.php', payload, 'admin-token', 'csrf-token');

		expect(axiosMocks.post).toHaveBeenCalledWith(
			'admin.php',
			payload,
			expect.objectContaining({
				headers: {
					'Content-Type': 'application/json',
					'X-NagiosTV-Admin-Token': 'admin-token',
					'X-NagiosTV-CSRF-Token': 'csrf-token',
				},
			}),
		);
	});
});
