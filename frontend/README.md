# Calculuzz Frontend

A calculator web app built with React and TypeScript. It shows the keypad and the screen; every calculation is sent to the [backend API](../backend/README.md).

## Run it

You need [Node.js 24](https://nodejs.org/) or newer, and the backend running on `http://localhost:8080`. From this `frontend` folder:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

The keypad works with the mouse or the keyboard: digits, `+ - * / ^ %`, `Enter` for `=`, `Backspace` to delete and `Escape` to clear.

## Settings

| Variable       | What it does            | Default                 |
| -------------- | ----------------------- | ----------------------- |
| `VITE_API_URL` | Address of the backend  | `http://localhost:8080` |

To change it, create a `.env` file in this folder with `VITE_API_URL=http://...`.

## Tests

```bash
npm test            # run all tests
npm run coverage    # run them and show coverage
```

## Run with Docker

```bash
docker build -t calculuzz-web .
docker run --rm -p 5173:8080 calculuzz-web
```

Open `http://localhost:5173`. To point it to another backend, add `--build-arg VITE_API_URL=http://...` to `docker build`.

## Project structure

```
src/
├── api/calculator.ts      The only file that talks to the backend
└── calculator/
    ├── calculatorReducer.ts   Calculator logic (plain functions, no React)
    ├── useCalculator.ts       Connects the logic with the API
    ├── keys.ts                Keypad layout and keyboard shortcuts
    ├── Calculator.tsx         Main component, plus keyboard support
    ├── Display.tsx            Screen
    └── Keypad.tsx             Buttons
```
