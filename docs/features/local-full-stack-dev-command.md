# Local Full-Stack Dev Command

## Purpose
Start the local backend and frontend from the repository root with one terminal command.

## How it works
Run `npm run dev` from the repository root. The root package script calls `scripts/dev.sh`, which starts `backend` with `npm --prefix backend run dev` and `frontend` with `npm --prefix frontend run dev`.

## Key decisions
The command uses npm's built-in `--prefix` support and a small shell script instead of adding a root dependency just to run two processes.

## Inputs/outputs
Input: installed dependencies in `backend/` and `frontend/`.

Output: backend listens on `http://localhost:3001`; frontend starts through Vite and proxies `/api` to the backend.

## Edge cases
Pressing Ctrl-C stops both child processes. If either process exits first, the script exits and cleans up the other process.

## Debugging
Run `bash -n scripts/dev.sh` to check script syntax. Then run `npm run dev` from the repository root and confirm both dev servers print their normal startup output.

## Related files
- `package.json`
- `scripts/dev.sh`
- `backend/package.json`
- `frontend/package.json`
- `frontend/vite.config.ts`
