# Use official python slim image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install python packages (no system libraries required!)
RUN pip install --no-cache-dir \
    runpod \
    numpy \
    requests \
    Pillow \
    firebase-admin

# Copy handler script into the container image
COPY rp_handler.py /app/rp_handler.py

# Start the RunPod handler
CMD [ "python", "-u", "/app/rp_handler.py" ]
