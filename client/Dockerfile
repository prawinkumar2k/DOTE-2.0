# ─── Frontend Dockerfile ─────────────────────────────────────────────────────────
# Multi-stage: Build React + Serve via Nginx

# Stage 1: Build the React (Vite) application
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Dependencies (cached layer)
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Production Nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Non-root: Nginx alpine image runs as nginx user by default
# But we need to fix permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
