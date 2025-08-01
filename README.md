# winv75

This repository contains a Vue 3 front‑end and an Express/MongoDB back‑end used to rank horses in races.

## Prerequisites

- **Node.js** 18 or later with `yarn` installed
- **MongoDB** running locally on `mongodb://localhost:27017`

## Getting Started

### 1. Clone and install dependencies

```bash
# clone repository and change directory
# git clone <repo-url>
cd winv75

# install backend dependencies
cd backend
yarn install

# install frontend dependencies
cd ../frontend
yarn install
```

### 2. Environment variables

The frontend expects the URL of the back‑end API in `VITE_BE_URL`. Create a `.env` file inside `frontend`:

```bash
VITE_BE_URL=http://localhost:3001
```

The back‑end server uses port `3001` by default. Adjust the value if you run the server on another port.

The ranking logic uses a weighted score. You can override the default weights with environment variables in the back‑end:

```bash
# optional scoring weights
SCORE_WEIGHT_POINTS=0.30
SCORE_WEIGHT_CONSISTENCY=0.30
SCORE_WEIGHT_WIN_RATE=0.25
SCORE_WEIGHT_PLACEMENT_RATE=0.15
```

### 3. Starting MongoDB

Make sure a MongoDB instance is running on `mongodb://localhost:27017`. The back‑end connects to a database named `winv75`.

### 4. Run the applications

Start the back‑end server:

```bash
cd backend
yarn dev
```

In a second terminal, start the front‑end dev server:

```bash
cd frontend
yarn dev
```

The Vue application will be available at <http://localhost:5173> by default and communicates with the API via `VITE_BE_URL`.

### 5. MongoDB aggregation scripts

The `mongodb-scripts` folder contains aggregation pipelines exported from MongoDB Compass. They can be loaded in the Aggregations tab of Compass for experimenting with ranking logic.

## Fetching raceday data automatically

To import startlists from the official Travsport API, the back‑end exposes a POST
endpoint:

```
POST /api/raceday/fetch?date=YYYY-MM-DD
```

It downloads all raceday startlists for the given date and stores them in MongoDB.
The front‑end provides a date field in the **Raceday Input** view where you can
trigger this fetch.

## Race comments and past performance

When a race is requested via `GET /api/race/:id`, the back‑end checks whether
any horses are missing comments or past race comments. Missing data triggers a
single fetch to ATG’s extended race endpoint, and the results are stored in
MongoDB. Subsequent requests use the cached data so the external data source is
only contacted when necessary.

## Horse Ranking

Each horse receives a score based on four weighted metrics:

1. **Points** – the official rating points.
2. **Consistency Score** – derived from placements where first place counts as three, second as two and third as one.
3. **Win Rate** – percentage of starts that resulted in a win.
4. **Placement Rate** – percentage of starts finishing in a paying position.

The total score is simply the sum of each metric multiplied by its weight:

```
points * SCORE_WEIGHT_POINTS
  + consistencyScore * SCORE_WEIGHT_CONSISTENCY
  + winRate * SCORE_WEIGHT_WIN_RATE
  + placementRate * SCORE_WEIGHT_PLACEMENT_RATE
```

Default weights are defined in the back‑end but can be overridden with optional
environment variables (`SCORE_WEIGHT_*`). The weights determine how much each
metric contributes to the final ranking.

The ranking output also includes data such as favorite track, driver and start
position, as well as the average odds when the horse finished in the top three.
These values are currently informational only and do not affect the score.

## Folder Naming Convention

Both the back‑end and front‑end organize source files under singular, lower‑case folders.
Core modules share the same names across the projects to keep imports predictable:

- `horse`
- `race`
- `raceday`
- `rating`

Using the same folder names makes it clear where new functionality belongs and simplifies refactoring.

## Building for production

To create optimized builds:

```bash
# back-end (nothing to build, just run with Node)

# front-end
cd frontend
yarn build
```

The compiled static files will be in `frontend/dist` and can be served by any static file server.

## Scheduled Ratings Update

The back‑end runs a cron job that recalculates Elo ratings every hour using
`update-elo-ratings.js`. Ratings are stored in the `horse_ratings` collection and
synced to the `horses` documents. The cron job can also be triggered manually via

```
POST /api/rating/update
```

which is helpful after importing new race results. The exported
`startRatingsCronJob` function is invoked automatically when the Express server
starts.

## Driver Collection

A helper script aggregates race results for each driver into its own `drivers` collection.
Run it after importing horse data:

```bash
cd backend
yarn build-drivers
```

The script is idempotent and rebuilds all driver documents from the current horse results.

### Updating Driver Elo Ratings

Drivers receive an Elo rating calculated from their race placements. Run the update script to recompute scores:

```bash
cd backend
yarn update-driver-elo
```

The cron job in the backend automatically recalculates driver ratings once per day.
