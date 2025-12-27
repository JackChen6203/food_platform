# Start from the official Go image
FROM golang:1.23 as builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Build the Go app
# CGO_ENABLED=0 is important for a static binary (often needed for scratch/alpine)
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# Use a lightweight image for the final container
FROM alpine:latest  

WORKDIR /root/

# Copy the pre-built binary file from the previous stage
COPY --from=builder /app/server .

# Expose port (Cloud Run ignores EXPOSE but it's good practice)
EXPOSE 8080

# Command to run the executable
CMD ["./server"]
