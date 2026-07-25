import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBrain,
	faChevronDown,
	faChevronLeft,
	faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { formatDateTimeAgo, formatDateTimeLocale } from '../../helpers/dates';
import { useLlmAnalysisController } from '../../hooks/useLlmAnalysisController';
import LLMMarkup from './LLMMarkup';
import { formatResponseDuration } from './llmAnalysis';
import './LocalLLM.css';

export default function LocalLLM() {
	const {
		analyze,
		clientSettings,
		currentHistoryIndex,
		currentHistoryItem,
		error,
		history,
		isLoading,
		lastResponseTime,
		llmResponse,
		navigateToNext,
		navigateToPrevious,
		responseEmoji,
	} = useLlmAnalysisController();
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState(0);
	const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

	useEffect(() => {
		const content = contentRef.current;
		if (!content) {
			return;
		}

		const resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				setContentHeight(entry.contentRect.height + 20);
			}
		});
		resizeObserver.observe(content);

		return () => resizeObserver.disconnect();
	}, [llmResponse]);

	const color = currentHistoryItem?.color || 'green';
	const borderClasses = `border-${color}`;

	return (
		<div className="my-2.5">
			<div className="flex justify-between items-center flex-wrap gap-2.5 mb-1.5">
				<h3 className="mr-2 mb-0 text-[#bbb]">
					AI Analysis
					{lastResponseTime && (
						<span className="ml-1">
							@ {formatDateTimeLocale(
								lastResponseTime.getTime(),
								clientSettings.locale,
								clientSettings.clockTimeFormat,
							)}
							{' '}({formatDateTimeAgo(lastResponseTime.getTime())} ago)
						</span>
					)}
				</h3>

				<div className="flex items-center gap-1.5">
					{isLoading && (
						<div className="flex items-center gap-2.5 text-[#444] text-[0.8em]">
							<div className="local-llm-spinner"></div>
						</div>
					)}

					{history.length > 0 && (
						<div className="flex items-center gap-0 mr-0 text-sm">
							<button
								onClick={navigateToPrevious}
								disabled={currentHistoryIndex <= 0}
								className={`p-1.5 rounded transition-all ${
									currentHistoryIndex <= 0
										? 'text-gray-600 cursor-not-allowed'
										: 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 cursor-pointer'
								}`}
								title="Previous response"
							>
								<FontAwesomeIcon icon={faChevronLeft} />
							</button>
							<span className="text-xs text-gray-300 font-medium min-w-[30px] text-center tabular-nums">
								{currentHistoryIndex + 1} / {history.length}
							</span>
							<button
								onClick={navigateToNext}
								disabled={currentHistoryIndex >= history.length - 1}
								className={`p-1.5 rounded transition-all ${
									currentHistoryIndex >= history.length - 1
										? 'text-gray-600 cursor-not-allowed'
										: 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 cursor-pointer'
								}`}
								title="Next response"
							>
								<FontAwesomeIcon icon={faChevronRight} />
							</button>
						</div>
					)}

					<button
						className="local-llm-button"
						onClick={analyze}
						disabled={isLoading}
					>
						{isLoading ? 'Thinking...' : 'Analyze'}
					</button>
				</div>
			</div>

			{error && (
				<div className="bg-[#4d1e1e] border border-[#7a2d2d] rounded px-2 py-1 text-[#e6a8a8] flex items-start gap-2.5 mb-2.5">
					<span role="img" aria-label="error">⚠️</span> {error}
				</div>
			)}

			{history.length === 0 && !llmResponse && (
				<div className="ServiceItemBorder border-green mt-2.5 pb-1.5!">
					<span className="mx-[5px] inline-block text-lime text-[1.5em]">
						No analysis performed yet
					</span>
				</div>
			)}

			{llmResponse && (
				<motion.div
					className={`local-llm-response ServiceItemBorder ${borderClasses} ${isLoading ? 'local-llm-response-loading' : ''} relative`}
					initial={false}
					animate={{ height: contentHeight }}
					transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
					style={{ overflow: 'hidden' }}
				>
					<div ref={contentRef} className="local-llm-response-inner">
						<div className="text-4xl leading-none row-span-2 col-start-1 flex items-start">
							{responseEmoji}
						</div>

						<div className={`local-llm-response-content${borderClasses === 'border-green' ? ' text-[1.5em]' : ''}`}>
							{currentHistoryItem?.thinkingContent && (
								<div className="mb-3">
									<button
										onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
										className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors cursor-pointer bg-transparent border-none p-0"
									>
										<FontAwesomeIcon icon={faBrain} className="text-purple-400" />
										<span>Chain of Thought</span>
										<FontAwesomeIcon
											icon={faChevronDown}
											className={`text-xs transition-transform duration-200 ${isThinkingExpanded ? 'rotate-180' : ''}`}
										/>
									</button>
									{isThinkingExpanded && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											transition={{ duration: 0.2 }}
											className="mt-2 p-3 bg-gray-800/50 border border-gray-700 rounded text-sm text-gray-300 overflow-auto max-h-64"
										>
											<pre className="whitespace-pre-wrap font-sans m-0">
												{currentHistoryItem.thinkingContent}
											</pre>
										</motion.div>
									)}
								</div>
							)}
							<LLMMarkup content={llmResponse} />
						</div>

						{currentHistoryItem?.model && (
							<div className="absolute bottom-1 right-2 text-[12px] text-gray-400 opacity-60">
								{currentHistoryItem.responseDurationMs !== undefined
									? `${formatResponseDuration(currentHistoryItem.responseDurationMs)} on ${currentHistoryItem.model}`
									: currentHistoryItem.model}
							</div>
						)}
					</div>
				</motion.div>
			)}
		</div>
	);
}
