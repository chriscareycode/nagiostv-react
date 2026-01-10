/**
 * NagiosTV https://nagiostv.com
 * Copyright (C) 2008-2025 Chris Carey https://chriscarey.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect, useState } from 'react';

/**
 * Hook that tracks browser tab visibility changes.
 * Returns a counter that increments each time the tab becomes visible.
 * This is useful for forcing re-renders/re-animations when the user
 * returns to a backgrounded tab, which can help fix animation states
 * that get stuck due to browser memory-saving features.
 */
export const useVisibilityChange = () => {
	const [visibilityKey, setVisibilityKey] = useState(0);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				// Increment the key when tab becomes visible again
				// This forces any components using this key to re-render
				setVisibilityKey(prev => prev + 1);
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	return visibilityKey;
};

export default useVisibilityChange;
