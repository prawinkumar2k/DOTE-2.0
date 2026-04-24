# ─── Backend Dockerfile ──────────────────────────────────────────────────────────
# Production-optimized Node.js container

FROM node:20-alpine AS base

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /usr/src/app

# ─── Dependencies (cached layer) ────────────────────────────────────────────────
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# ─── Application source ─────────────────────────────────────────────────────────
COPY . .

# Create uploads directory with correct permissions
RUN mkdir -p uploads/student/photos uploads/student/documents uploads/home && \
    chown -R appuser:appgroup uploads

# Switch to non-root
USER appuser

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
