FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json

RUN pnpm install --frozen-lockfile

COPY apps/admin-web apps/admin-web

ARG VITE_KEYCLOAK_ENABLED=false
ARG VITE_KEYCLOAK_URL=http://localhost:8080
ARG VITE_KEYCLOAK_REALM=connected-neighbours
ARG VITE_KEYCLOAK_CLIENT_ID=connected-neighbours-admin
ENV VITE_KEYCLOAK_ENABLED=$VITE_KEYCLOAK_ENABLED
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

RUN pnpm --filter ./apps/admin-web run build

FROM nginx:1.27-alpine

COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/admin-web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=10s \
  CMD wget -qO- http://127.0.0.1/ || exit 1
