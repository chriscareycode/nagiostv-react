import { useMemo } from 'react';
import './LLMMarkup.css';

interface LLMMarkupProps {
	content: string;
}

export default function LLMMarkup({ content }: LLMMarkupProps) {
	// Parse the markdown-like content and convert to React elements
	const parsedContent = useMemo(() => {
		// Replace multiple consecutive newlines with single newlines
		const normalizedContent = content.replace(/\n\n+/g, '\n\n');
		const lines = normalizedContent.split('\n');
		const elements: JSX.Element[] = [];
		let currentList: string[] = [];
		let currentCodeBlock: string[] = [];
		let currentTable: string[] = [];
		let inCodeBlock = false;
		let codeBlockLanguage = '';

		const flushList = () => {
			if (currentList.length > 0) {
				elements.push(
					<ul key={`list-${elements.length}`} className="llm-list">
						{currentList.map((item, idx) => (
							<li key={idx} className="llm-list-item">
								{parseInlineMarkdown(item)}
							</li>
						))}
					</ul>
				);
				currentList = [];
			}
		};

		const flushCodeBlock = () => {
			if (currentCodeBlock.length > 0) {
				elements.push(
					<pre key={`code-${elements.length}`} className="llm-code-block">
						<code className={codeBlockLanguage ? `language-${codeBlockLanguage}` : ''}>
							{currentCodeBlock.join('\n')}
						</code>
					</pre>
				);
				currentCodeBlock = [];
				codeBlockLanguage = '';
			}
		};

		const flushTable = () => {
			if (currentTable.length > 0) {
				// Parse table rows
				const rows = currentTable.filter(row => {
					// Filter out separator rows (like |---|---|)
					const cleaned = row.replace(/\s/g, '');
					return !cleaned.match(/^\|[-:|\s]+\|?$/);
				});

				if (rows.length > 0) {
					const headerRow = rows[0];
					const bodyRows = rows.slice(1);

					// Parse cells from a row
					const parseCells = (row: string): string[] => {
						return row
							.split('|')
							.map(cell => cell.trim())
							.filter(cell => cell !== '');
					};

					const headerCells = parseCells(headerRow);
					
					elements.push(
						<table key={`table-${elements.length}`} className="llm-table">
							<thead>
								<tr>
									{headerCells.map((cell, idx) => (
										<th key={idx}>{parseInlineMarkdown(cell)}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{bodyRows.map((row, rowIdx) => {
									const cells = parseCells(row);
									return (
										<tr key={rowIdx}>
											{cells.map((cell, cellIdx) => (
												<td key={cellIdx}>{parseInlineMarkdown(cell)}</td>
											))}
										</tr>
									);
								})}
							</tbody>
						</table>
					);
				}
				currentTable = [];
			}
		};

		let firstParagraphRendered = false;

		const parseInlineMarkdown = (text: string): (string | JSX.Element)[] => {
			// Parse bold/italic first, then handle inline code within those
			return parseTextWithBoldItalic(text, 0);
		};

		const parseTextWithBoldItalic = (text: string, startIndex: number): (string | JSX.Element)[] => {
			const parts: (string | JSX.Element)[] = [];
			let current = text;

			// Handle bold (**text** or __text__)
			// Match ** followed by content (non-greedy) followed by **
			// OR __ followed by content (non-greedy) followed by __
			const boldRegex = /\*\*(.+?)\*\*|__(.+?)__/g;
			let lastIndex = 0;
			let match;
			let partIndex = startIndex;

			while ((match = boldRegex.exec(current)) !== null) {
				// Add text before the match
				if (match.index > lastIndex) {
					const beforeText = current.substring(lastIndex, match.index);
					parts.push(...parseItalic(beforeText, partIndex));
					partIndex += beforeText.length;
				}
				// Add the bold text (match[1] for ** or match[2] for __)
				const boldText = match[1] || match[2];
				// Parse the content inside bold for italics and status words
				const boldContent = parseItalic(boldText, partIndex);
				parts.push(
					<strong key={`bold-${partIndex}`} className="llm-bold">
						{boldContent}
					</strong>
				);
				partIndex++;
				lastIndex = match.index + match[0].length;
			}

			// Add remaining text
			if (lastIndex < current.length) {
				const remainingText = current.substring(lastIndex);
				parts.push(...parseItalic(remainingText, partIndex));
			}

			return parts;
		};

		const parseItalic = (text: string, startIndex: number): (string | JSX.Element)[] => {
			const parts: (string | JSX.Element)[] = [];
			
			// Handle italic (*text* or _text_) - but not ** or __
			const italicRegex = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|(?<!_)_(?!_)([^_]+)_(?!_)/g;
			let lastIndex = 0;
			let match;
			let partIndex = startIndex;

			while ((match = italicRegex.exec(text)) !== null) {
				// Add text before the match
				if (match.index > lastIndex) {
					const beforeText = text.substring(lastIndex, match.index);
					parts.push(...parseInlineCode(beforeText, partIndex));
				}
				// Add the italic text
				const italicText = match[1] || match[2];
				// Parse the content inside italic for inline code and status words
				const italicContent = parseInlineCode(italicText, partIndex);
				parts.push(
					<em key={`italic-${partIndex}`} className="llm-italic">
						{italicContent}
					</em>
				);
				partIndex++;
				lastIndex = match.index + match[0].length;
			}

			// Add remaining text
			if (lastIndex < text.length) {
				const remainingText = text.substring(lastIndex);
				parts.push(...parseInlineCode(remainingText, partIndex));
			}

			return parts.length > 0 ? parts : [text];
		};

		const parseInlineCode = (text: string, startIndex: number): (string | JSX.Element)[] => {
			const parts: (string | JSX.Element)[] = [];
			
			// Handle inline code (backticks)
			const codeRegex = /`([^`]+)`/g;
			let lastIndex = 0;
			let match;
			let partIndex = startIndex;

			while ((match = codeRegex.exec(text)) !== null) {
				// Add text before the match
				if (match.index > lastIndex) {
					const beforeText = text.substring(lastIndex, match.index);
					parts.push(...highlightStatusWords(beforeText, partIndex));
				}
				// Add the inline code
				parts.push(
					<code key={`code-${partIndex}`} className="llm-inline-code">
						{match[1]}
					</code>
				);
				partIndex++;
				lastIndex = match.index + match[0].length;
			}

			// Add remaining text
			if (lastIndex < text.length) {
				const remainingText = text.substring(lastIndex);
				parts.push(...highlightStatusWords(remainingText, partIndex));
			}

			return parts.length > 0 ? parts : [text];
		};

		const highlightStatusWords = (text: string, startIndex: number): (string | JSX.Element)[] => {
			const parts: (string | JSX.Element)[] = [];
			
			// Match DOWN, CRITICAL, WARNING, or UNKNOWN as whole words (case-insensitive)
			const statusRegex = /\b(DOWN|CRITICAL|WARNING|UNKNOWN)\b/gi;
			let lastIndex = 0;
			let match;
			let partIndex = startIndex;

			while ((match = statusRegex.exec(text)) !== null) {
				// Add text before the match
				if (match.index > lastIndex) {
					parts.push(text.substring(lastIndex, match.index));
				}
				
				// Determine the color class based on the status word (case-insensitive)
				let colorClass = '';
				const word = match[1].toUpperCase();
				if (word === 'DOWN' || word === 'CRITICAL') {
					colorClass = 'color-red';
				} else if (word === 'WARNING' || word === 'Warning') {
					colorClass = 'color-yellow';
				} else if (word === 'UNKNOWN') {
					colorClass = 'color-orange';
				}
				
				// Add the status word with appropriate color (preserve original case)
				parts.push(
					<span key={`status-${elements.length}-${startIndex}-${partIndex}-${match.index}`} className={colorClass} style={{ fontWeight: 'bold' }}>
						{match[1]}
					</span>
				);
				partIndex++;
				lastIndex = match.index + match[0].length;
			}

			// Add remaining text
			if (lastIndex < text.length) {
				parts.push(text.substring(lastIndex));
			}

			return parts.length > 0 ? parts : [text];
		};

		lines.forEach((line, index) => {
			// Handle code blocks
			if (line.trim().startsWith('```')) {
				if (!inCodeBlock) {
					flushList();
					flushTable();
					inCodeBlock = true;
					// Extract language if specified
					const lang = line.trim().substring(3).trim();
					if (lang) {
						codeBlockLanguage = lang;
					}
				} else {
					inCodeBlock = false;
					flushCodeBlock();
				}
				return;
			}

			if (inCodeBlock) {
				currentCodeBlock.push(line);
				return;
			}

			// Handle markdown tables (lines with pipes)
			const isTableRow = line.trim().includes('|') && line.trim().length > 1;
			if (isTableRow) {
				flushList();
				currentTable.push(line);
				return;
			} else if (currentTable.length > 0) {
				// We were in a table but this line isn't part of it
				flushTable();
			}

			// Handle headings
			const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
			if (headingMatch) {
				flushList();
				flushTable();
				const level = headingMatch[1].length;
				const text = headingMatch[2];
				const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
				elements.push(
					<HeadingTag key={`heading-${index}`} className={`llm-heading llm-heading-${level}`}>
						{parseInlineMarkdown(text)}
					</HeadingTag>
				);
				return;
			}

			// Handle unordered lists (-, *, +)
			const listMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
			if (listMatch) {
				flushTable();
				currentList.push(listMatch[1]);
				return;
			}

			// Handle numbered lists
			const numberedListMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
			if (numberedListMatch) {
				flushTable();
				if (currentList.length === 0) {
					flushList();
				}
				currentList.push(numberedListMatch[1]);
				return;
			}

		// Empty line - flush list if any
		if (line.trim() === '') {
			flushList();
			flushCodeBlock();
			flushTable();
			// Don't add <br> - let CSS margins handle spacing between elements
			return;
		}			// Regular paragraph
			flushList();
			flushTable();
			if (line.trim()) {
				const isFirstParagraph = !firstParagraphRendered;
				if (isFirstParagraph) {
					firstParagraphRendered = true;
				}
				elements.push(
					<p key={`p-${index}`} className={isFirstParagraph ? "llm-paragraph llm-first-paragraph" : "llm-paragraph"}>
						{parseInlineMarkdown(line)}
					</p>
				);
			}
		});

		// Flush any remaining lists, code blocks, or tables
		flushList();
		flushCodeBlock();
		flushTable();

		return elements;
	}, [content]);

	return (
		<div className="llm-markup">
			{parsedContent}
		</div>
	);
}
