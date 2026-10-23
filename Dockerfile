FROM node:20-bullseye-slim

WORKDIR /app

# Install native build tools for compiling SQLite binaries on Linux
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package definitions
COPY package*.json ./

# Install dependencies inside the container for the target architecture
RUN npm install --production

# Copy application code
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
