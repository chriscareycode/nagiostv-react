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

import { memo, useEffect, useState } from 'react';
import './HowManyEmoji.css';

interface HowManyEmojiProps {
	howMany: number;
	howManyWarning: number;
	howManyCritical: number;
}

interface EmojiSelection {
	redEmoji: string;
	yellowEmoji: string;
	greenEmoji: string;
}

const redEmojis = ['😡', '🌺', '💋', '🐙', '🌹', '🍉', '🍓', '🍟', '🎟', '🚒', '🥵', '🤬', '👹', '👺', '💄', '👠', '🐞', '🦑', '🦐', '🦞', '🦀'];
const yellowEmojis = ['😳', '😲', '🤯', '🥑', '💰', '🧽', '🔑', '⚠️', '🚸', '🔆', '🎗', '☹️', '😢', '🤮'];
const greenEmojis = ['🍀', '💚', '🥦', '🍏', '♻️', '🐢', '🐸', '🔋', '📗', '🌲', '🌴', '🥒', '🎾'];

const selectEmojis = (): EmojiSelection => ({
	redEmoji: redEmojis[Math.floor(Math.random() * redEmojis.length)],
	yellowEmoji: yellowEmojis[Math.floor(Math.random() * yellowEmojis.length)],
	greenEmoji: greenEmojis[Math.floor(Math.random() * greenEmojis.length)]
});

const HowManyEmoji = memo(({ howManyWarning, howManyCritical }: HowManyEmojiProps) => {
	const [emojis, setEmojis] = useState<EmojiSelection>({
		redEmoji: '',
		yellowEmoji: '',
		greenEmoji: ''
	});

	useEffect(() => {
		const initialTimeoutHandle = setTimeout(() => {
			setEmojis(selectEmojis());
		}, 100);

		// Randomize the emojis on some interval
		//const interv = 60 * 60 * 1000; // hour
		const interv = 60 * 1000; // 60 seconds
		const intervalHandle = setInterval(() => {
			setEmojis(selectEmojis());
		}, interv);

		return () => {
			clearTimeout(initialTimeoutHandle);
			clearInterval(intervalHandle);
		};
	}, []);

	const criticals = [...Array(howManyCritical)].map((_, i) => (
		<span key={`crit_${i}`} role="img" aria-label="item down" className="HowManyEmojiItem HowManyEmojiItemProblem">{emojis.redEmoji}</span>
	));
	const warnings = [...Array(howManyWarning)].map((_, i) => (
		<span key={`warn_${i}`} role="img" aria-label="item down" className="HowManyEmojiItem HowManyEmojiItemProblem">{emojis.yellowEmoji}</span>
	));

	return <span className="HowManyEmojiWrap">{[...criticals, ...warnings]}</span>;
});

HowManyEmoji.displayName = 'HowManyEmoji';

export default HowManyEmoji;
