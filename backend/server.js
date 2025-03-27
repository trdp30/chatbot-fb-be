import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import DocumentProcessor from './rag/documentProcessor.js';
import VectorStore from './rag/vectorStore.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

const documentProcessor = new DocumentProcessor();
const vectorStore = new VectorStore();

// Initialize vector store without blocking server startup
vectorStore.initialize().catch(error => {
    console.error('Failed to initialize vector store:', error);
    console.log('Server will continue running, but RAG features will be unavailable');
});

// Endpoint to check ChromaDB status
app.get('/api/status', async (req, res) => {
    try {
        const isInitialized = await vectorStore.initialized;
        res.json({
            status: isInitialized ? 'ready' : 'not_ready',
            message: isInitialized ? 'ChromaDB is connected and ready' : 'ChromaDB is not connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Endpoint to upload documents
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const text = req.file.buffer.toString('utf-8');
        const metadata = {
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        };

        // Process the document
        const { documents, vectors } = await documentProcessor.processText(text, metadata);

        // Add to vector store
        const ids = await vectorStore.addDocuments(documents, vectors);

        res.json({
            message: 'Document processed successfully',
            documentCount: documents.length,
            ids: ids
        });
    } catch (error) {
        console.error('Error processing document:', error);
        res.status(500).json({
            error: 'Error processing document',
            message: error.message
        });
    }
});

// Endpoint to interact with Ollama using RAG
app.post('/api/ollama', async (req, res) => {
    try {
        const { prompt } = req.body;
        const OLLAMA_BASE_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Perform similarity search
        const relevantDocs = await vectorStore.similaritySearch(prompt);
        
        // Construct context from relevant documents
        const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');

        // Construct the system prompt with RAG context
        const systemPrompt = `You are an AI assistant that uses the following context to answer questions.
        If the answer cannot be found in the context, say "I don't have enough information to answer that question."
        Do not use any knowledge outside of this context.

        Context:
        ${context}

        User question: ${prompt}`;

        // Make request to Ollama with streaming enabled
        const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
            prompt: systemPrompt,
            model: 'mistral',
            stream: true,
            options: {
                temperature: 0.3,
                top_p: 0.7,
                num_predict: 2048,
                stop: ["</s>", "User:", "Assistant:", "I don't have enough information"],
                seed: 42,
                repeat_penalty: 1.2,
                presence_penalty: 0.6
            }
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

// Endpoint to clear the vector store
app.post('/api/clear-store', async (req, res) => {
    try {
        await vectorStore.deleteCollection();
        res.json({ message: 'Vector store cleared successfully' });
    } catch (error) {
        console.error('Error clearing vector store:', error);
        res.status(500).json({
            error: 'Error clearing vector store',
            message: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.send('Hello from the backend!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Using Ollama API URL: ${process.env.OLLAMA_API_URL}`);
});
