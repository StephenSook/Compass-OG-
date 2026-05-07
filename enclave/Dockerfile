# Compass receipt-signer image for 0G TeeML / dstack TDX deployment.
# Multi-stage: build TS to dist/, then run on slim Node.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc --noEmit && \
    npx tsc --outDir dist src/server.ts && \
    cp -r src/types dist/types 2>/dev/null || true

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node", "/app/dist/server.js"]
