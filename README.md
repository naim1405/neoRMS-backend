# neo-RMS backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

This project was created using `bun init` in bun v1.2.20. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Docker

### Development (hot reload)

```bash
docker compose -f compose.dev.yaml up --build
```

- API runs on `http://localhost:5000`
- Source is bind-mounted, so code changes auto-reload via `npm run dev`

Stop development stack:

```bash
docker compose -f compose.dev.yaml down
```

### Production-style local run

```bash
docker compose up --build
```

Stop production-style stack:

```bash
docker compose down
```

### Notes

- Do not run both stacks at once (same ports).
- To reset database data, use `down -v` on the stack you are using.
