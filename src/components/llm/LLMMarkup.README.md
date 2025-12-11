# LLMMarkup Component

## Overview
The LLMMarkup component is a specialized markdown renderer designed to display LLM responses in the LocalLLM component. It parses and renders markdown-formatted text into styled HTML elements.

## Features

### Supported Markdown Elements

#### Headings
- `# Heading 1` through `###### Heading 6`
- Each level has distinct styling and color
- H1 includes an underline border

#### Text Formatting
- **Bold text**: `**bold**` or `__bold__`
- *Italic text*: `*italic*` or `_italic_`
- Inline code: `` `code` ``

#### Lists
- Unordered lists: Lines starting with `-`, `*`, or `+`
- Numbered lists: Lines starting with `1.`, `2.`, etc.
- Nested lists are supported

#### Code Blocks
- Fenced code blocks: ` ```language` ... ` ``` `
- Syntax: ` ```json`, ` ```javascript`, ` ```python`, etc.
- Code blocks have syntax highlighting hints via CSS classes

#### Other Elements
- Paragraphs: Regular text lines
- Line breaks: Empty lines create spacing
- Links: Automatically styled (if LLM includes them)
- Blockquotes: Border-left styling (if needed)
- Horizontal rules: Styled dividers

## Usage

```tsx
import LLMMarkup from './LLMMarkup';

function MyComponent() {
  const markdownText = `
# Analysis Summary

This is a **bold** statement with *italic* emphasis.

## Key Points
- First point with \`inline code\`
- Second point
- Third point

### Code Example
\`\`\`javascript
const result = analyze(data);
\`\`\`
  `;

  return <LLMMarkup content={markdownText} />;
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| content | string | Yes | The markdown-formatted string to render |

## Implementation Details

### Parsing Strategy
The component uses a line-by-line parsing approach:
1. Splits content by newlines
2. Identifies markdown patterns (headings, lists, code blocks, etc.)
3. Converts each pattern to appropriate React elements
4. Handles inline formatting (bold, italic, code) within text

### Performance
- Uses `useMemo` to cache parsed content
- Only re-parses when content changes
- Efficient regex-based inline parsing

### Styling
All styles are contained in `LLMMarkup.css`:
- Dark theme matching NagiosTV
- Color-coded headings (blue gradient)
- Distinct styling for code blocks and inline code
- Responsive design for mobile devices

## Example LLM Response

```markdown
# Infrastructure Analysis

## Current Status
Based on the monitoring data, there are **3 critical issues** requiring immediate attention.

### Priority 1: Database Server
- Host: `db-prod-01`
- Status: **DOWN**
- Action: Investigate connection issues

### Recommendations
1. Check database service status
2. Review recent configuration changes
3. Monitor disk space

\`\`\`bash
systemctl status postgresql
\`\`\`
```

This would render with:
- Color-coded headings
- Bold emphasis on critical text
- Properly formatted lists
- Syntax-highlighted code block
- Inline code styling

## Customization

To customize the appearance, edit `LLMMarkup.css`:

- **Heading colors**: Modify `.llm-heading-*` classes
- **Code block theme**: Update `.llm-code-block` styling
- **List markers**: Change `.llm-list-item::marker` color
- **Inline code**: Adjust `.llm-inline-code` background and color

## Browser Compatibility

The component uses standard React and CSS features compatible with all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Future Enhancements

Potential improvements:
- Tables support
- Checkbox lists (`- [ ]` and `- [x]`)
- Image rendering
- Syntax highlighting library integration (e.g., Prism.js)
- LaTeX/math equation support
- Collapsible sections
- Copy-to-clipboard for code blocks
