FROM rs-base

WORKDIR /app

# Copy the entire application
COPY . .

# Build dependencies to cache them
RUN cargo build --release

# Make the run.sh script executable
RUN chmod +x /app/.hxckr/run.sh

# Make the run.sh script executable
ENTRYPOINT ["/bin/bash"]
