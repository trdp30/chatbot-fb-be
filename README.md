# Chatbot with Ollama Integration

This project is a full-stack chatbot application that integrates with Ollama for AI-powered conversations. The application consists of three main components: a frontend chat interface, a backend server, and an Ollama service for AI processing.

## Project Structure

```
.
├── chat-bot/          # Frontend React application
├── backend/           # Node.js backend server
├── ollama/           # Ollama service configuration
└── docker-compose.yml # Docker composition file
```

## Components

### Frontend (chat-bot)
- Built with React and TypeScript
- Uses Vite as the build tool
- Styled with Tailwind CSS
- Features a modern UI with components from Radix UI
- Port: 3000

### Backend
- Node.js/Express server
- Handles communication between frontend and Ollama service
- Port: 3001

### Ollama Service
- AI processing service
- Port: 11434
- Uses external volume for model storage

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

## Getting Started

1. Clone the repository
2. Create the required Docker volume:
   ```bash
   docker volume create ollama-data
   ```
3. Start the application using Docker Compose:
   ```bash
   docker-compose up
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Ollama Service: http://localhost:11434

## Development

### Frontend Development
```bash
cd chat-bot
npm install
npm run dev
```

### Backend Development
```bash
cd backend
npm install
npm start
```

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

```
OLLAMA_API_URL=http://ollama:11434
```

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - Radix UI
  - Axios

- Backend:
  - Node.js
  - Express
  - Axios
  - CORS

- Infrastructure:
  - Docker
  - Docker Compose
  - Ollama

## License

This project is licensed under the MIT License. 