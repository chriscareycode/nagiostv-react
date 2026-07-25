import { ClientSettings } from '../../types/settings';
import LlmModelSelector from './LlmModelSelector';
import { BooleanSettingRow } from './SettingControls';
import { SettingsChangeHandler } from './settingsTypes';

interface LlmSettingsProps {
	onChange: SettingsChangeHandler;
	settings: ClientSettings;
}

type PromptSettingKey =
	| 'llmDoomguyPrompt'
	| 'llmPromptAllOk'
	| 'llmPromptNotOk';

interface PromptSetting {
	description: string;
	placeholder: string;
	property: PromptSettingKey;
	rows: number;
	title: string;
}

const promptSettings: PromptSetting[] = [
	{
		property: 'llmDoomguyPrompt',
		title: 'Doomguy Prompt',
		description: 'Appended to the system prompt when Doomguy is enabled. Controls the Doomguy balloon text in the AI response. The prompt needs to output in the format: Doomguy says "<message>" to work properly.',
		placeholder: 'Prompt appended to system prompt when Doomguy is enabled',
		rows: 8,
	},
	{
		property: 'llmPromptAllOk',
		title: 'Prompt (All OK)',
		description: 'Custom instructions appended to the LLM prompt when all services/hosts are OK (0 items down)',
		placeholder: 'Additional instructions when 0 items are down',
		rows: 12,
	},
	{
		property: 'llmPromptNotOk',
		title: 'Prompt (Issues)',
		description: 'Custom instructions appended to the LLM prompt when there are issues (1 or more items down)',
		placeholder: 'Additional instructions when 1 or more items are down',
		rows: 12,
	},
];

const LlmServerInstructions = () => (
	<tr>
		<td colSpan={2} style={{ paddingLeft: '20px', paddingTop: '10px', paddingBottom: '10px' }}>
			<div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '5px', border: '1px solid #444' }}>
				<strong>ℹ️ LLM Server Setup Instructions:</strong>
				<ul style={{ marginTop: '10px', marginBottom: '5px', paddingLeft: '20px' }}>
					<li style={{ marginBottom: '5px' }}>
						<strong>Ollama:</strong> Install from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4a90e2' }}>ollama.com</a>,
						run <code style={{ backgroundColor: '#1e1e1e', padding: '2px 6px', borderRadius: '3px' }}>ollama serve</code>
						<br />Base URL: <code style={{ backgroundColor: '#1e1e1e', padding: '2px 6px', borderRadius: '3px' }}>http://localhost:11434</code>
					</li>
					<li style={{ marginBottom: '5px' }}>
						<strong>LM Studio:</strong> Download from <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#4a90e2' }}>lmstudio.ai</a>,
						load a model, and start the local server
						<br />Base URL: <code style={{ backgroundColor: '#1e1e1e', padding: '2px 6px', borderRadius: '3px' }}>http://localhost:1234</code>
					</li>
					<li style={{ marginBottom: '5px' }}>
						<strong>LocalAI:</strong> Run via Docker: <code style={{ backgroundColor: '#1e1e1e', padding: '2px 6px', borderRadius: '3px' }}>docker run -p 8080:8080 localai/localai:latest</code>
						<br />Base URL: <code style={{ backgroundColor: '#1e1e1e', padding: '2px 6px', borderRadius: '3px' }}>http://localhost:8080</code>
					</li>
				</ul>
				<div style={{ marginTop: '10px', fontSize: '0.9em', color: '#999' }}>
					The AI Analysis component will use these settings to connect to your local LLM server and provide insights on monitoring issues.
				</div>
			</div>
		</td>
	</tr>
);

const LlmSettings = ({ onChange, settings }: LlmSettingsProps) => (
	<table className="SettingsTable">
		<thead>
			<tr>
				<td colSpan={2} className="SettingsTableHeader">🤖 AI / LLM Integration Settings</td>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th style={{ padding: '0px', height: '3px' }}></th>
				<td style={{ padding: '0px', height: '3px' }}></td>
			</tr>
			<BooleanSettingRow
				falseLabel="Show (Enabled)"
				onChange={onChange}
				property="hideLocalLLMSection"
				title="Local LLM"
				trueLabel="Hide (Disabled)"
				value={settings.hideLocalLLMSection}
			/>
			{!settings.hideLocalLLMSection && (
				<>
					<tr>
						<th>LLM Backend Type:</th>
						<td>
							<select
								aria-label="LLM Backend Type"
								value={settings.llmBackendType}
								onChange={onChange('llmBackendType', 'string')}
							>
								<option value="openai-compatible">OpenAI-Compatible</option>
								<option value="anthropic">Anthropic</option>
								<option value="lmstudio">LM Studio</option>
							</select>
							<br />
							<span style={{ fontSize: '0.9em', color: '#888' }}>
								Selects which request/response adapter plugin to use for this LLM server.
							</span>
						</td>
					</tr>
					<tr>
						<th>LLM Server Base URL:</th>
						<td>
							<input
								aria-label="LLM Server Base URL"
								type="text"
								value={settings.llmServerBaseUrl}
								onChange={onChange('llmServerBaseUrl', 'string')}
								placeholder="http://localhost:1234"
							/>
							<br />
							<span style={{ fontSize: '0.9em', color: '#888' }}>
								Base URL to your LLM server. The request path is selected from backend type (OpenAI-compatible, Anthropic, or LM Studio).<br />
								Examples:<br />
								• Ollama: <code>http://localhost:11434</code><br />
								• LM Studio: <code>http://localhost:1234</code><br />
								• LocalAI: <code>http://localhost:8080</code>
							</span>
						</td>
					</tr>
					<tr>
						<th>LLM Model:</th>
						<td>
							<LlmModelSelector
								llmBackendType={settings.llmBackendType}
								llmModel={settings.llmModel}
								llmServerBaseUrl={settings.llmServerBaseUrl}
								llmApiKey={settings.llmApiKey}
								onChange={onChange('llmModel', 'string')}
							/>
						</td>
					</tr>
					<tr>
						<th>LLM API Key:</th>
						<td>
							<input
								aria-label="LLM API Key"
								type="password"
								value={settings.llmApiKey}
								onChange={onChange('llmApiKey', 'string')}
								placeholder="Optional - leave empty for local servers"
							/>
							<br />
							<span style={{ fontSize: '0.9em', color: '#888' }}>
								API key for authentication (optional for most local LLM servers)
							</span>
						</td>
					</tr>
					<tr>
						<th>LLM Thinking Time:</th>
						<td>
							<select
								aria-label="LLM Thinking Time"
								value={settings.llmThinkingLevel}
								onChange={onChange('llmThinkingLevel', 'string')}
							>
								<option value="off">Off (Direct responses)</option>
								<option value="low">Low (Fastest)</option>
								<option value="medium">Medium (Balanced)</option>
								<option value="high">High (Most thorough)</option>
							</select>
							<br />
							<span style={{ fontSize: '0.9em', color: '#888' }}>
								Controls reasoning effort for compatible models. If your server does not support this option, NagiosTV will fall back automatically.
							</span>
						</td>
					</tr>
					<BooleanSettingRow
						description="When enabled, the AI response will be spoken aloud using your browser's text-to-speech."
						falseLabel="Off"
						onChange={onChange}
						property="llmSpeakResponse"
						title="Speak LLM Response"
						trueLabel="On"
						value={settings.llmSpeakResponse}
					/>
					<tr>
						<th>System Prompt:</th>
						<td>
							<div className="text-[0.9em] text-[#888]">
								The system prompt sent to the LLM. Available variables:<br />
								<code className="bg-[#1e1e1e] px-1.5 py-0.5 rounded">{'{{DATE}}'}</code> - Current date (e.g., 2026-01-01)<br />
								<code className="bg-[#1e1e1e] px-1.5 py-0.5 rounded">{'{{TIME}}'}</code> - Current time (e.g., 14:30:45)<br />
								<code className="bg-[#1e1e1e] px-1.5 py-0.5 rounded">{'{{DAY_OF_WEEK}}'}</code> - Day of the week (e.g., Thursday)
							</div>
							<textarea
								aria-label="System Prompt"
								value={settings.llmSystemPrompt}
								onChange={onChange('llmSystemPrompt', 'string')}
								placeholder="System prompt for the LLM"
								rows={8}
								className="w-full font-mono text-[0.9em]"
								style={{ fontFamily: 'monospace', fontSize: '0.9em' }}
							/>
						</td>
					</tr>
					{promptSettings.map(prompt => (
						<tr key={prompt.property}>
							<th>{prompt.title}:</th>
							<td>
								<span style={{ fontSize: '0.9em', color: '#888' }}>{prompt.description}</span>
								<br />
								<textarea
									aria-label={prompt.title}
									value={settings[prompt.property]}
									onChange={onChange(prompt.property, 'string')}
									placeholder={prompt.placeholder}
									rows={prompt.rows}
									style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9em' }}
								/>
							</td>
						</tr>
					))}
					<LlmServerInstructions />
				</>
			)}
		</tbody>
	</table>
);

export default LlmSettings;
