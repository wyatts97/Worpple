FROM node:22-alpine AS base

# Build dependencies (needed for better-sqlite3 native addon)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* .npmrc ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source
COPY . .

# Generate SvelteKit types
RUN npm run prepare

# Build
RUN npm run build

# Production stage
FROM node:22-alpine AS production

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy production artifacts
COPY --from=base /app/build ./build
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start
CMD ["node", "build"]
