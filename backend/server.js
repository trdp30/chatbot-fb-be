const express = require('express');
const axios = require('axios');
const app = express();
const port = 3001;

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to interact with Ollama
app.post('/api/ollama', async (req, res) => {
  try {
    const { prompt } = req.body;
    const OLLAMA_BASE_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
    console.log('Using Ollama URL:', OLLAMA_BASE_URL);
    console.log('Sending request to Ollama...');
    
    // Add timeout and retry configuration
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, { 
      prompt,
      model: 'mistral'
    }, {
      timeout: 30000, // 30 second timeout
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Accept all status codes less than 500
      }
    });
    
    console.log('Received response from Ollama');
    
    // Process the streaming response
    const responseLines = response.data.split('\n').filter(line => line.trim());
    let fullResponse = '';
    let lastResponse = null;
    
    responseLines.forEach(line => {
      try {
        const data = JSON.parse(line);
        if (data.response) {
          fullResponse += data.response;
        }
        lastResponse = data;
      } catch (e) {
        console.error('Error parsing response line:', e);
      }
    });

    // Send a clean response with both the full text and metadata
    res.json({
      text: fullResponse,
      metadata: {
        model: lastResponse?.model,
        total_duration: lastResponse?.total_duration,
        eval_count: lastResponse?.eval_count,
        done: lastResponse?.done,
        done_reason: lastResponse?.done_reason
      }
    });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });

    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'Ollama service is not ready yet',
        message: 'Please wait a few moments and try again',
        details: error.message,
        url: process.env.OLLAMA_API_URL
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
