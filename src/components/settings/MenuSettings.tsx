import { ClientSettings } from '../../types/settings';
import Doomguy from '../Doomguy/Doomguy';
import { BooleanSettingRow } from './SettingControls';
import { SettingsChangeHandler } from './settingsTypes';

interface MenuSettingsProps {
	onChange: SettingsChangeHandler;
	settings: ClientSettings;
}

type DoomguyThresholdKey =
	| 'doomguyAngryAt'
	| 'doomguyBloodyAt'
	| 'doomguyConcernedAt';

interface DoomguyThreshold {
	description: string;
	property: DoomguyThresholdKey;
	title: string;
}

const doomguyThresholds: DoomguyThreshold[] = [
	{
		property: 'doomguyConcernedAt',
		title: 'Doomguy concerned at',
		description: 'hosts DOWN, services WARNING or CRITICAL',
	},
	{
		property: 'doomguyAngryAt',
		title: 'Doomguy angry at',
		description: 'hosts DOWN, services WARNING or CRITICAL',
	},
	{
		property: 'doomguyBloodyAt',
		title: 'Doomguy bloody at',
		description: 'hosts DOWN, services CRITICAL',
	},
];

const MenuSettings = ({ onChange, settings }: MenuSettingsProps) => (
	<table className="SettingsTable">
		<thead>
			<tr>
				<td colSpan={2} className="SettingsTableHeader">Top and Bottom Menu</td>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th style={{ padding: '0px', height: '3px' }}></th>
				<td style={{ padding: '0px', height: '3px' }}></td>
			</tr>
			<tr>
				<th>Title:</th>
				<td>
					<input
						aria-label="Title"
						type="text"
						value={settings.titleString}
						onChange={onChange('titleString', 'string')}
					/>
				</td>
			</tr>
			<BooleanSettingRow
				falseLabel="Off"
				onChange={onChange}
				property="customLogoEnabled"
				title="Custom Logo"
				trueLabel="On"
				value={settings.customLogoEnabled}
			/>
			{settings.customLogoEnabled && (
				<tr>
					<th>Custom Logo URL:</th>
					<td>
						<input
							aria-label="Custom Logo URL"
							type="text"
							value={settings.customLogoUrl}
							onChange={onChange('customLogoUrl', 'string')}
						/>
					</td>
				</tr>
			)}
			<BooleanSettingRow
				description={(
					<span style={{ position: 'relative' }}>
						The character from the 1993 video game Doom
						<span style={{ position: 'absolute', top: 0, right: -56, height: 32, width: 24 }}>
							<Doomguy scaleCss="0.5" style={{ position: 'absolute', top: -13 }} showBalloon={false} />
						</span>
					</span>
				)}
				falseLabel="Off"
				onChange={onChange}
				property="doomguyEnabled"
				title="Doomguy"
				trueLabel="On"
				value={settings.doomguyEnabled}
			/>
			{settings.doomguyEnabled && (
				<tr>
					<td colSpan={2}>
						<div style={{ paddingLeft: '40px' }}>
							<table style={{ width: '100%', border: '1px solid #5f5f5f' }}>
								<tbody>
									{doomguyThresholds.map(threshold => (
										<tr key={threshold.property}>
											<th>{threshold.title}</th>
											<td>
												<input
													aria-label={threshold.title}
													type="number"
													min="0"
													max="100"
													value={settings[threshold.property]}
													onChange={onChange(threshold.property, 'number')}
												/>
												{' '}{threshold.description}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</td>
				</tr>
			)}
			<BooleanSettingRow
				falseLabel="Show"
				onChange={onChange}
				property="hideHamburgerMenu"
				title="Hamburger (Top) Menu"
				trueLabel="Hide"
				value={settings.hideHamburgerMenu}
			/>
			<BooleanSettingRow
				falseLabel="Show"
				onChange={onChange}
				property="hideBottomMenu"
				title="Bottom Menu"
				trueLabel="Hide"
				value={settings.hideBottomMenu}
			/>
		</tbody>
	</table>
);

export default MenuSettings;
