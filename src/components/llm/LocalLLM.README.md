# LocalLLM Component

## Overview
The LocalLLM component provides AI-powered analysis of Nagios monitoring data using an OpenAI-compatible local LLM server (such as Ollama, LM Studio, or LocalAI).

## Features
- Automatically fetches host and service issues from the Nagios monitoring state
- Sends formatted monitoring data to a local LLM server
- Displays AI-generated insights and recommendations
- Configurable LLM server connection (hostname, port, model, API key)
- Error handling and loading states
- Clean, responsive UI

## Usage

### 1. Add to Dashboard
Import and add the LocalLLM component to your Dashboard:

```tsx
import LocalLLM from './summary/LocalLLM';

// Inside your component
{!hideLocalLLMSection && <LocalLLM />}
```

### 2. Configure LLM Server
The component uses the following settings from `clientSettings`:

- `llmServerBaseUrl`: Base URL to the OpenAI-compatible LLM server (default: 'http://localhost:1234'). The path /v1/chat/completions is added automatically.
- `llmModel`: Model name to use (default: 'gpt-3.5-turbo')
- `llmApiKey`: Optional API key for authentication (default: '')

### 3. Example LLM Server Setup

#### Using Ollama
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama2

# Run the server (default port 11434)
ollama serve
```

Configure in NagiosTV:
- Base URL: `http://localhost:11434`
- Model: `llama2`

#### Using LM Studio
1. Download and install LM Studio
2. Load a model
3. Start the local server (typically on port 1234)

Configure in NagiosTV:
- Base URL: `http://localhost:1234`
- Model: Name of the loaded model

#### Using LocalAI
```bash
docker run -p 8080:8080 localai/localai:latest
```

Configure in NagiosTV:
- Base URL: `http://localhost:8080`
- Model: Available model name

## API Compatibility
The component uses the OpenAI Chat Completions API format:

```
POST http://{host}:{port}/v1/chat/completions
```

Request body:
```json
{
  "model": "model-name",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

## Component Structure

### Props
The component doesn't accept any props. It uses Jotai atoms to access global state.

### State Management
- Uses `hostAtom` for host issues
- Uses `serviceAtom` for service issues
- Uses `clientSettingsAtom` for LLM configuration

### Local State
- `isLoading`: Boolean indicating if a query is in progress
- `llmResponse`: String containing the LLM's response
- `error`: String containing any error messages

## Styling
The component includes its own CSS file (`LocalLLM.css`) with:
- Dark theme matching NagiosTV's aesthetic
- Responsive design for mobile and desktop
- Loading spinner animation
- Color-coded status messages

## Error Handling
The component handles various error scenarios:
- Missing LLM server configuration
- Connection failures
- Timeout errors (30 seconds)
- Server errors
- Empty responses

## Future Enhancements
Potential improvements:
- Streaming responses
- Response caching
- Historical analysis
- Custom prompt templates
- Multiple LLM provider support
- Token usage tracking
- Response quality indicators
