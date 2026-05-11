# Compass receipt-signer image for 0G TeeML / dstack TDX deployment.
FROM node:26-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc --noEmit && \
    npx tsc --outDir dist src/server.ts && \
    cp -r src/types dist/types 2>/dev/null || true

FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
EXPOSE 8080
# Use node directly for healthcheck — wget/curl not in node:22-alpine by default.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "/app/dist/server.js"]
