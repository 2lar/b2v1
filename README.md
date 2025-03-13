# Second Brain - Simple Version

This is a simplified version of the Second Brain application, focusing on core functionality. It allows you to create notes, visualize their connections in a knowledge graph, and chat with an AI about your notes.

## Features

- **Note Taking**: Create and view notes in a Twitter-like feed
- **Knowledge Graph**: Visualize connections between your notes
- **AI Chat**: Interact with an AI that can reference your notes
- **Local File Storage**: All data is stored in JSON files

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/yourusername/second-brain-simple.git
   cd second-brain-simple
   ```

2. Install dependencies for both server and client
   ```bash
   npm run install-all
   ```

3. (Optional) Add your OpenAI API key for AI functionality
   Create a `.env` file in the root directory and add:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
second-brain-simple/
├── client/                # React frontend
├── server/                # Express backend
│   └── data/              # JSON files for storage
│       ├── notes.json     # Stores all notes
│       └── connections.json # Stores graph connections
```

## How It Works

1. **Notes**: When you create a note, it's stored in `server/data/notes.json`
2. **Connections**: The server automatically detects semantic similarities between notes and creates connections in `server/data/connections.json`
3. **Knowledge Graph**: The graph visualization shows notes as nodes and their connections as edges
4. **AI Chat**: When you ask a question, the AI finds relevant notes and uses them to generate a response

## Incrementally Building

This simplified version is designed to be a starting point. You can incrementally add features from the full version:

1. Add tagging system
2. Implement note editing and deletion
3. Add user settings and preferences
4. Enhance the knowledge graph with more advanced features
5. Improve the semantic analysis for better connections

## License

This project is licensed under the MIT License - see the LICENSE file for details.