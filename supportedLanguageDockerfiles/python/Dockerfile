FROM py-base

WORKDIR /app

# Copy requirements.txt if it exists
COPY requirements.txt* ./
# Install pytest and any other requirements
RUN pip install pytest \
    && if [ -f "requirements.txt" ]; then pip install -r requirements.txt; fi

# Copy the application code and tests
COPY . .

# Make the run script executable
RUN chmod +x /app/.hxckr/run.sh

CMD ["/app/.hxckr/run.sh"]
