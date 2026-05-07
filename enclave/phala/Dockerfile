# Compass enclave — Phala TDX deployment image.
# Built on node:22-alpine for small attack surface. The dstack guest agent
# socket /var/run/dstack.sock is mounted by docker-compose at runtime; we do
# not bake credentials into the image.
FROM node:22-alpine AS builder

WORKDIR /app

COPY ../package.json ../package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY ../src ./src
COPY ../tsconfig.json ./
COPY phala/src ./phala-src

RUN npx tsc --noEmit && \
    npx tsc --outDir /app/dist src/*.ts phala/src/*.ts

FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

EXPOSE 8080

CMD ["node", "/app/dist/phala-src/server.js"]
