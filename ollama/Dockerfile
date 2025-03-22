# Use Debian as the base image (more stable than Ubuntu for this case)
FROM debian:bullseye-slim

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Configure DNS
# RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
#     echo "nameserver 8.8.4.4" >> /etc/resolv.conf

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set up Ollama data directory
RUN mkdir -p /root/.ollama

# Copy the startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose the Ollama port
EXPOSE 11434

# Use the startup script
CMD ["/start.sh"] 