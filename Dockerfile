FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Start a new stage for the runtime image
FROM alpine:3.14

# Install necessary packages and Nix
RUN apk add --no-cache curl xz bash git && \
    addgroup -S nixbld && \
    for i in $(seq 1 10); do adduser -S -D -h /var/empty -g "Nix build user $i" -G nixbld nixbld$i; done && \
    mkdir -m 0755 /nix && chown root /nix && \
    mkdir -m 0755 /etc/nix && \
    echo 'sandbox = false' > /etc/nix/nix.conf && \
    curl -L https://nixos.org/nix/install | NIX_INSTALLER_NO_MODIFY_PROFILE=1 sh && \
    . /root/.nix-profile/etc/profile.d/nix.sh && \
    echo '. /root/.nix-profile/etc/profile.d/nix.sh' >> /root/.bashrc && \
    /root/.nix-profile/bin/nix-env -iA nixpkgs.nodejs && \
    /root/.nix-profile/bin/nix-collect-garbage -d

# Set up environment for Nix
ENV PATH="/root/.nix-profile/bin:${PATH}" \
    NIX_PATH="/nix/var/nix/profiles/per-user/root/channels"

# Copy built artifacts and node_modules from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["/bin/bash", "-c", "source /root/.nix-profile/etc/profile.d/nix.sh && node dist/server.js"]
