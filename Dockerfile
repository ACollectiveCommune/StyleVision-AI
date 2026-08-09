# Use official python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install and upgrade runpod, PIL, and other dependencies
RUN pip install --no-cache-dir -U runpod
RUN pip install --no-cache-dir \
    numpy \
    requests \
    Pillow \
    firebase-admin

# Copy handler script into the container image
COPY rp_handler.py /app/rp_handler.py

# Start the RunPod handler
CMD [ "python", "-u", "/app/rp_handler.py" ]
