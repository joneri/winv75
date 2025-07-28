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

## Building for production

To create optimized builds:

```bash
# back-end (nothing to build, just run with Node)

# front-end
cd frontend
yarn build
```

The compiled static files will be in `frontend/dist` and can be served by any static file server.

