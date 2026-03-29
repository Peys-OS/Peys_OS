FROM node:20-alpine

# Install dependencies for puppeteer/chromium
RUN apk add --no-cache \
    chromium \
    ca-certificates \
    ttf-freefont \
    udev \
    dumb-init

# Set puppeteer to use installed chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_CHROMIUM_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-accelerated-2d-canvas,--no-first-run,--no-zygote,--disable-gpu
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY server/ ./server/

# Create directories for session data
RUN mkdir -p .waweb_auth .wwebjs_cache /app/.waweb_auth_backup

# Set permissions
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Start with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the bot
CMD ["node", "server/index.mjs"]
