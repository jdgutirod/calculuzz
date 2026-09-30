# Build stage: compile a static binary.
FROM golang:1.27-alpine AS build

WORKDIR /src

# Download dependencies first so this layer is cached between code changes.
COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

# Run stage: only the binary, on a minimal image with no shell, as a non-root user.
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=build /out/api /api

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/api"]
