FROM ts-base

WORKDIR /app

# Copy the entire application
COPY . .

# Install dependencies
RUN bun install

# Make the run.sh script executable
RUN chmod +x /app/.hxckr/run.sh

# I figured it will be better to have bash as entry point
ENTRYPOINT ["/bin/bash"]
