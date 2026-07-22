FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web

ARG VITE_KEYCLOAK_ENABLED=false
ARG VITE_KEYCLOAK_URL=http://localhost:8080
ARG VITE_KEYCLOAK_REALM=connected-neighbours
ARG VITE_KEYCLOAK_CLIENT_ID=connected-neighbours-web
ARG VITE_KEYCLOAK_ACCOUNT_URL=http://localhost:8080/realms/connected-neighbours/account
ENV VITE_KEYCLOAK_ENABLED=$VITE_KEYCLOAK_ENABLED
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID
ENV VITE_KEYCLOAK_ACCOUNT_URL=$VITE_KEYCLOAK_ACCOUNT_URL

RUN pnpm --filter ./apps/web run build

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
