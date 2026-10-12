# Frontend: the React app, built to static files
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Backend: one static Go binary
FROM golang:1.25-alpine AS api
WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/plantengids .

# Runtime: distroless and non-root; the binary serves the API and the site
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=api /out/plantengids /app/plantengids
COPY --from=web /web/dist /app/static
ENV STATIC_DIR=/app/static PORT=8080
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/app/plantengids"]
