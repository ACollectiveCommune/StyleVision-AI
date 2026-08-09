# Use official PyTorch image with GPU support if needed, or lightweight Python base
FROM python:3.9-slim

# Install system dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install python packages
RUN pip install --no-cache-dir \
    runpod \
    numpy \
    opencv-python-headless \
    requests \
    firebase-admin

# Copy handler script into the container image
COPY rp_handler.py /app/rp_handler.py

# Start the RunPod handler
CMD [ "python", "-u", "/app/rp_handler.py" ]
