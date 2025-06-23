# syntax=docker/dockerfile:1
ARG NODE_VERSION=20.19.2
ARG PNPM_VERSION=10.12.1

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

# Download dependencies as a separate step to take advantage of Docker's caching.
FROM base AS deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --prefer-offline

# Download 'devDependencies' and build the application.
FROM deps AS build
ENV NODE_ENV=production
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=tsconfig.json,target=tsconfig.json \
    --mount=type=bind,source=tsup.config.ts,target=tsup.config.ts \
    --mount=type=bind,source=src,target=src \
    pnpm build

# Copy the production dependencies from the deps stage and also
# the built application from the build stage into the image.
FROM base AS final
ENV NODE_ENV=production
COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.mjs", "http"]

