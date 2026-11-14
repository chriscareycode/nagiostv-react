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

export const parseHostAliases = (hosts: unknown): Record<string, string> => {
	if (!hosts || typeof hosts !== 'object' || Array.isArray(hosts)) return {};
	const aliases: Record<string, string> = {};
	for (const [name, details] of Object.entries(hosts)) {
		if (details && typeof details === 'object' && !Array.isArray(details)) {
			const alias = (details as { alias?: unknown }).alias;
			if (typeof alias === 'string' && alias.trim() && alias !== name) {
				aliases[name] = alias;
			}
		}
	}
	return aliases;
};

export const hostAlias = (aliases: Record<string, string>, name: string): string =>
	Object.prototype.hasOwnProperty.call(aliases, name) ? aliases[name] : '';
