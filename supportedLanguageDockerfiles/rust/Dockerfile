FROM rs-base

WORKDIR /app

# Copy the entire application
COPY . .

# Make the run.sh script executable
RUN chmod +x /app/.hxckr/run.sh

CMD ["/bin/bash"]
