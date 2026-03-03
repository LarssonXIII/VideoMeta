FROM node:22-bullseye-slim

# Create and change to the app directory
WORKDIR /app

# Copy package dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose ports for both the Vite frontend (5173) and the Express backend (3001)
EXPOSE 5173
EXPOSE 3001

# The start command that runs both concurrently
CMD ["npm", "run", "dev"]
