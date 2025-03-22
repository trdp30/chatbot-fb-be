#!/bin/bash

# Start Ollama in the background
ollama serve &

# Wait for Ollama to start
sleep 5

# Pull the Mistral model
ollama pull mistral

# Keep the container running
tail -f /dev/null
