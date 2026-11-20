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

import { expect, it } from 'vitest';
import { hostAlias, parseHostAliases } from './hostAliases';

it('reads aliases from objectjson or Livestatus and falls back for missing hosts', () => {
	const aliases = parseHostAliases({
		'host_one': { name: 'host_one', alias: 'Server Room One' },
		'host_two': { alias: '' },
		'host_three': { alias: 'host_three' },
	});
	expect(hostAlias(aliases, 'host_one')).toBe('Server Room One');
	expect(hostAlias(aliases, 'host_two')).toBe('');
	expect(hostAlias(aliases, 'host_three')).toBe('');
	expect(hostAlias(aliases, 'toString')).toBe('');
});
