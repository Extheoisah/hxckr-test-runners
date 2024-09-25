# Stage 1: Build environment
FROM node:16-alpine AS builder

# Install build dependencies and Git
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Create final image
FROM gcr.io/distroless/nodejs:16

# Copy Git and its dependencies from the builder stage
COPY --from=builder /usr/bin/git /usr/bin/git
COPY --from=builder /lib/libz.so.1 /lib/libz.so.1
COPY --from=builder /usr/lib/libpcre2-8.so.0 /usr/lib/libpcre2-8.so.0
COPY --from=builder /lib/ld-musl-x86_64.so.1 /lib/ld-musl-x86_64.so.1

# Set working directory
WORKDIR /app

# Copy application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["dist/server.js"]
