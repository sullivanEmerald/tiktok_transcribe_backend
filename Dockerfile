# Use official Node.js LTS image
FROM node:18-slim

# Install ffmpeg, ffprobe, ffplay, and Python3/pip for yt-dlp
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Install NestJS CLI globally for build
RUN npm install -g @nestjs/cli

# Copy the rest of your app
COPY . .

# Build the app (if using TypeScript)
RUN npm run build

# Expose the port your NestJS app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
