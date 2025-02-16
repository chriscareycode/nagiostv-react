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

import { Component } from 'react';
import './HowManyEmoji.css';

interface HowManyEmojiProps {
	howMany: number;
	howManyWarning: number;
	howManyCritical: number;
}

interface HowManyEmojiState {
	redEmoji: string;
	yellowEmoji: string;
	greenEmoji: string;
}

class HowManyEmoji extends Component<HowManyEmojiProps, HowManyEmojiState> {

	shouldComponentUpdate(nextProps: HowManyEmojiProps, nextState: HowManyEmojiState) {
		//console.log('HowManyEmoji shouldComponentUpdate', nextProps, nextState);
		if (
			nextProps.howMany !== this.props.howMany ||
			nextProps.howManyWarning !== this.props.howManyWarning ||
			nextProps.howManyCritical !== this.props.howManyCritical ||
			nextState.redEmoji !== this.state.redEmoji ||
			nextState.yellowEmoji !== this.state.yellowEmoji ||
			nextState.greenEmoji !== this.state.greenEmoji
		) {
			return true;
		} else {
			return false;
		}
	}

	redEmojis = ['😡', '🌺', '💋', '🐙', '🌹', '🍉', '🍓', '🍟', '🎟', '🚒', '🥵', '🤬', '👹', '👺', '💄', '👠', '🐞', '🦑', '🦐', '🦞', '🦀'];
	yellowEmojis = ['😳', '😲', '🤯', '🥑', '💰', '🧽', '🔑', '⚠️', '🚸', '🔆', '🎗', '☹️', '😢', '🤮'];
	greenEmojis = ['🍀', '💚', '🥦', '🍏', '♻️', '🐢', '🐸', '🔋', '📗', '🌲', '🌴', '🥒', '🎾'];

	state = {
		redEmoji: '',
		yellowEmoji: '',
		greenEmoji: ''
	};

	intervalHandle: NodeJS.Timeout | null = null;

	componentDidMount() {

		setTimeout(() => {
			this.selectEmojis();
		}, 100);

		// Randomize the emojis on some interval
		//const interv = 60 * 60 * 1000; // hour
		const interv = 60 * 1000; // 60 seconds
		this.intervalHandle = setInterval(() => {
			this.selectEmojis();
		}, interv);
	}

	componentWillUnmount() {
		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
		}
	}

	selectEmojis() {
		const redEmoji = this.redEmojis[Math.floor(Math.random() * this.redEmojis.length)];
		const yellowEmoji = this.yellowEmojis[Math.floor(Math.random() * this.yellowEmojis.length)];
		const greenEmoji = this.greenEmojis[Math.floor(Math.random() * this.greenEmojis.length)];

		this.setState({
			redEmoji,
			yellowEmoji,
			greenEmoji
		})
	}

	render() {

		// add criticals
		const criticals = [...Array(this.props.howManyCritical)].map((item, i) => {
			return <span key={`crit_${i}`} role="img" aria-label="item down" className="HowManyEmojiItem HowManyEmojiItemProblem">{this.state.redEmoji}</span>;
		});
		// add warnings
		const warnings = [...Array(this.props.howManyWarning)].map((item, i) => {
			return <span key={`warn_${i}`} role="img" aria-label="item down" className="HowManyEmojiItem HowManyEmojiItemProblem">{this.state.yellowEmoji}</span>;
		});
		// merge two arrays
		const res = [...criticals, ...warnings];

		return (
			<span className="HowManyEmojiWrap">
				{res}
			</span>
		);
	}
}

export default HowManyEmoji;
