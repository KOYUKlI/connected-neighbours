FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api

RUN pnpm --filter ./apps/api run build

RUN pnpm --filter ./apps/api deploy --prod --legacy /app/deploy

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/deploy/package.json ./package.json
COPY --from=builder --chown=app:app /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/apps/api/dist ./dist
COPY --from=builder --chown=app:app /app/apps/api/src/dsl/grammar ./src/dsl/grammar

USER app

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=15s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "dist/main"]
