# Second Brain - Simple Version

A personal knowledge management system that helps you organize your thoughts and ideas, visualize connections between them, and chat with an AI about your notes.

## Features

- **Note Taking**: Create, view, and manage notes
- **Knowledge Graph**: Visualize connections between your notes
- **AI Chat**: Interact with an AI that can reference your notes
- **Category Management**: Automatic categorization of notes using AI
- **Local File Storage**: All data is stored in JSON files

## Tech Stack

- **Frontend**: React with TypeScript, React Router, CSS
- **Backend**: Node.js with Express and TypeScript
- **AI Integration**: OpenAI API, Google Gemini API, or local LLM via Ollama
- **Visualization**: Cytoscape.js with Cola layout

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- (Optional) OpenAI API key or other LLM configuration

### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/yourusername/second-brain-typescript.git
   cd second-brain-typescript
   ```

2. Install dependencies for both server and client
   ```bash
   npm run install-all
   ```

3. (Optional) Add your OpenAI API key for AI functionality
   Create a `.env` file in the server directory and add:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
   Or configure another LLM provider in the app settings.

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
second-brain-typescript/
├── client/                # React frontend
│   ├── public/           # Static files
│   └── src/              # React components and logic
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Page components
│       └── services/     # API client services
├── server/                # Express backend
│   ├── src/              # TypeScript source code
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── data/             # JSON files for storage
│       ├── notes.json    # Stores all notes
│       ├── connections.json # Stores graph connections
│       └── categories.json # Stores note categories
└── shared/               # Shared TypeScript definitions
    └── types.ts          # Type definitions used by both client and server
```

## How It Works

1. **Notes**: When you create a note, it's stored in `server/data/notes.json`
2. **Connections**: The server automatically detects semantic similarities between notes and creates connections in `server/data/connections.json`
3. **Categories**: Notes are automatically categorized using AI or text analysis in `server/data/categories.json`
4. **Knowledge Graph**: The graph visualization shows notes as nodes and their connections as edges
5. **AI Chat**: When you ask a question, the AI finds relevant notes and uses them to generate a response

## AI Configuration Options

1. **OpenAI API** - Provide an API key in the `.env` file
2. **Google Gemini** - Configure in the app settings with your free Gemini API key
3. **Local LLM** - Connect to a locally running model via Ollama
4. **Basic (No AI)** - Falls back to simple text analysis if no AI configuration is provided

## Building for Production

To build the application for production deployment:

```bash
npm run build
```

This will:
1. Build the TypeScript server into JavaScript
2. Build the React client into optimized static files
3. Prepare everything for deployment

## Development

### Running in Development Mode

```bash
# Run both client and server in development mode
npm run dev

# Run only the server
npm run server

# Run only the client
npm run client
```

### TypeScript Type Checking

```bash
# Check types in server code
cd server && npm run typecheck

# Check types in client code
cd client && npm run typecheck
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project is a TypeScript refactoring of the original Second Brain application
- Uses [Cytoscape.js](https://js.cytoscape.org/) for graph visualization
- Uses various LLM integrations for AI functionality











===========================================================================================
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