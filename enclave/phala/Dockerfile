# Compass enclave — Phala dstack TDX deployment image.
# At runtime /var/run/dstack.sock is mounted by docker-compose; the server
# detects it and switches to TEE mode (deterministic secp256k1 key derived
# inside the enclave, eth address committed into TDX quote report_data).
# Build context: enclave/ (parent of this Dockerfile).
FROM node:26-alpine AS builder
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -p tsconfig.json

FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "/app/dist/server.js"]
