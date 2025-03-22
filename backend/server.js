const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from the frontend
  methods: ['GET', 'POST'], // Allow specific HTTP methods
  allowedHeaders: ['Content-Type'] // Allow specific headers
}));

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to interact with Ollama
app.post('/api/ollama', async (req, res) => {
  try {
    const { prompt } = req.body;
    const OLLAMA_BASE_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Make request to Ollama with streaming enabled
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, { 
      prompt,
      model: 'mistral',
      stream: true
    }, {
      responseType: 'stream',
      timeout: 30000,
      maxRedirects: 5
    });

    // Pipe the Ollama response stream to the client
    response.data.on('data', chunk => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            // Send each chunk as an SSE event
            res.write(`data: ${JSON.stringify(data)}\n\n`);
          }
        } catch (e) {
          console.error('Error parsing response line:', e);
        }
      });
    });

    response.data.on('end', () => {
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });

    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'Ollama service is not ready yet',
        message: 'Please wait a few moments and try again',
        details: error.message
      });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).json({
        error: 'Ollama service timeout',
        message: 'The request took too long to complete',
        details: error.message
      });
    } else {
      res.status(500).json({
        error: 'Error communicating with Ollama',
        message: error.message,
        details: error.response?.data || 'No additional details available'
      });
    }
  }
});

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
  console.log('Environment variables:', {
    OLLAMA_API_URL: process.env.OLLAMA_API_URL
  });
});
