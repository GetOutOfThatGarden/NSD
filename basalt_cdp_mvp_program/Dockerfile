# Use the official Rust image as base
FROM rust:1.70-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libudev-dev \
    libusb-1.0-0-dev \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the Cargo.toml and Cargo.lock files
COPY Cargo.toml .
COPY Cargo.lock .

# Copy the program source code
COPY programs/basalt_cdp_mvp/src ./programs/basalt_cdp_mvp/src

# Build the program
RUN cargo build --release

# Copy the built program to a new image
FROM debian:bullseye-slim

# Install required libraries
RUN apt-get update && apt-get install -y \
    libudev-dev \
    libusb-1.0-0-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m -u 1000 solana

# Set working directory
WORKDIR /app

# Copy the built program
COPY --from=0 /app/target/release/basalt_cdp_mvp.so .

# Change ownership
RUN chown -R solana:solana /app

# Switch to non-root user
USER solana

# Default command
CMD ["./basalt_cdp_mvp.so"]