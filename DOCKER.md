# Frontend Docker Setup

This runs the Next.js frontend in a containerized dev environment so every developer uses the same Node and pnpm versions.

## Files

- `Dockerfile`
- `docker-compose.frontend.yml`
- `.env.docker.example`

## First-time setup

1. Copy `.env.docker.example` to `.env.docker`
2. Update the API URLs and any other frontend env values you need
3. Start the container:

```bash
docker compose -f docker-compose.frontend.yml up -d --build
```

## App URL

- Frontend: `http://localhost:3001`

## Common commands

Start:

```bash
docker compose -f docker-compose.frontend.yml up -d --build
```

Stop:

```bash
docker compose -f docker-compose.frontend.yml down
```

View logs:

```bash
docker compose -f docker-compose.frontend.yml logs -f
```

## Notes

- Source code is mounted into the container for live development
- `node_modules` stays inside Docker to avoid host compatibility issues
- Real secrets should stay in `.env.docker`, not in git
