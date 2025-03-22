# Use official Node.js image as the base
FROM node:23.6.0

# Set the working directory for the backend
WORKDIR /app

# Copy backend code
COPY . .

# Install backend dependencies
RUN npm install

# Expose backend port
EXPOSE 3001

# Start the backend
CMD ["npm", "start"]
