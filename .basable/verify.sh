set -euo pipefail

# Frontend: regenerate the lockfile from the pinned versions, type-check and build
(
  cd frontend
  rm -f package-lock.json
  npm install --no-audit --no-fund
  npm run build
)

# Backend: regenerate go.sum, vet, test and compile
(
  cd backend
  rm -f go.sum
  go mod tidy
  go vet ./...
  go test ./...
  go build -o /dev/null .
)

# Manifests: the same render the deploy workflow lints
if command -v kustomize >/dev/null 2>&1; then
  kustomize build --enable-helm k8s/ >/dev/null
elif command -v kubectl >/dev/null 2>&1; then
  kubectl kustomize k8s/ >/dev/null
fi
if grep -rn ':latest' k8s/; then
  echo "k8s/ must not use :latest tags" >&2
  exit 1
fi

# The image, without pushing
docker build .
