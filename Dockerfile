# JBIT Form Testing Docker Container
FROM mcr.microsoft.com/playwright:v1.55.1-jammy

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV CI=true
ENV CUSTOMER=jbit

# Create necessary directories
RUN mkdir -p customers/jbit/reports/html-report \
    && mkdir -p customers/jbit/reports/test-artifacts

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user for security
RUN groupadd -r playwright && useradd -r -g playwright -G audio,video playwright \
    && mkdir -p /home/playwright/Downloads \
    && chown -R playwright:playwright /home/playwright \
    && chown -R playwright:playwright /app

# Set up proper permissions for reports directory
RUN chown -R playwright:playwright customers/jbit/reports

# Switch to non-root user
USER playwright

# Health check to ensure container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Container is healthy')" || exit 1

# Default command - run smoke tests
CMD ["npm", "run", "test:smoke"]

# Labels for metadata
LABEL maintainer="JBIT Form Testing Team"
LABEL description="Automated form testing container for JBIT customer"
LABEL version="1.0.0"
LABEL customer="jbit"