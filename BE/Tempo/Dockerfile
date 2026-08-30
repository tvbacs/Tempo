FROM node:20-bullseye-slim

# Install python3, ffmpeg, ca-certificates, and yt-dlp
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    ca-certificates \
    curl \
    && pip3 install --no-cache-dir yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

ENV PORT=5050
ENV NODE_ENV=production

EXPOSE 5050

CMD ["node", "src/index.js"]
