# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN corepack enable && \
    (test -f pnpm-lock.yaml && pnpm install --frozen-lockfile) || \
    (test -f package-lock.json && npm ci) || \
    npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS runner
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && chown appuser:appgroup /var/run/nginx.pid
EXPOSE 3000
USER appuser
CMD ["nginx", "-g", "daemon off;"]
