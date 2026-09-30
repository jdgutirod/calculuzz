# Calculuzz API

A small REST API that does math. You send two numbers as JSON, it sends back the result as JSON.

Written in Go, using only the standard library.

## Quick start

You need [Go 1.27](https://go.dev/dl/) or newer. From this `backend` folder:

```bash
go run ./cmd/api
```

The server starts on `http://localhost:8080`. Check it is alive:

```bash
curl http://localhost:8080/health
# {"message":"API healthy","status":"ok"}
```

Stop it with `Ctrl+C`.

## Run with Docker

```bash
docker build -t calculuzz-api .
docker run --rm -p 8080:8080 calculuzz-api
```

## Settings

The server reads two optional environment variables:

| Variable         | What it does                                          | Default                 |
| ---------------- | ----------------------------------------------------- | ----------------------- |
| `PORT`           | Port the server listens on                            | `8080`                  |
| `ALLOWED_ORIGIN` | Website allowed to call the API from a browser (CORS) | `http://localhost:5173` |

Example:

```bash
PORT=3000 ALLOWED_ORIGIN=http://localhost:4173 go run ./cmd/api
```

## How to use the API

Every operation works the same way:

1. Send a `POST` request to the operation's path.
2. Put the numbers in a JSON body: `{"a": 10, "b": 4}`.
3. Read the answer: `{"result": 2.5}`, or `{"error": "..."}` if something went wrong.

### Endpoints

| Method | Path        | What it returns          | Body                  |
| ------ | ----------- | ------------------------ | --------------------- |
| `GET`  | `/health`   | Whether the server is up | none                  |
| `POST` | `/add`      | `a + b`                  | `{"a": 5, "b": 3}`    |
| `POST` | `/subtract` | `a - b`                  | `{"a": 5, "b": 3}`    |
| `POST` | `/multiply` | `a × b`                  | `{"a": 5, "b": 3}`    |
| `POST` | `/divide`   | `a ÷ b`                  | `{"a": 6, "b": 3}`    |
| `POST` | `/pow`      | `a` to the power of `b`  | `{"a": 2, "b": 8}`    |
| `POST` | `/sqrt`     | Square root of `a`       | `{"a": 9}`            |
| `POST` | `/percent`  | `b` percent of `a`       | `{"a": 200, "b": 15}` |

`a` and `b` can be any number: negative, decimal (`2.5`) or in scientific notation (`1e3`).
`/sqrt` only needs `a`; if you send `b`, it is ignored.

### Examples

```bash
curl -X POST http://localhost:8080/add -d '{"a": 5, "b": 3}'
# {"result":8}

curl -X POST http://localhost:8080/divide -d '{"a": 10, "b": 4}'
# {"result":2.5}

curl -X POST http://localhost:8080/pow -d '{"a": 2, "b": 10}'
# {"result":1024}

curl -X POST http://localhost:8080/sqrt -d '{"a": 16}'
# {"result":4}

curl -X POST http://localhost:8080/percent -d '{"a": 200, "b": 15}'
# {"result":30}
```

### Errors

When something goes wrong, the response has an error status code and a message:

```bash
curl -X POST http://localhost:8080/divide -d '{"a": 5, "b": 0}'
# {"error":"division by zero is not allowed"}
```

| Status | Message                                           | When it happens                                                                                               |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `400`  | `invalid JSON body`                               | The body is not valid JSON, has unknown fields, has text instead of numbers, or has extra data after the JSON |
| `400`  | `fields a and b are required`                     | `a` or `b` is missing or `null`                                                                               |
| `400`  | `field a is required`                             | `a` is missing or `null` in `/sqrt`                                                                           |
| `400`  | `division by zero is not allowed`                 | `/divide` with `b` equal to `0`                                                                               |
| `400`  | `square root of a negative number is not allowed` | `/sqrt` with a negative `a`                                                                                   |
| `404`  | `404 page not found` (plain text)                 | The path does not exist                                                                                       |
| `405`  | `Method Not Allowed` (plain text)                 | Wrong method, for example `GET /add`                                                                          |
| `413`  | `request body is too large`                       | The body is bigger than 1 KB                                                                                  |
| `422`  | `result is too large or undefined`                | The result is infinite or not a number, for example `10^400` or the power `(-8)^0.5`                          |

A missing number is an error, never treated as `0`. So `{"a": 5}` on `/add` fails instead of returning `5`.

## Tests

```bash
go test ./...          # run all tests
go test -cover ./...   # run them and show coverage
```

To see which lines are covered in your browser:

```bash
go test -coverprofile=cover.out ./...
go tool cover -html=cover.out
```

## Project structure

```
backend/
├── cmd/api/main.go           Starts the server: settings, timeouts, clean shutdown
└── internal/
    ├── calculator/           The math. Pure functions, no HTTP
    │   └── math.go
    └── handlers/             The HTTP layer
        ├── router.go         List of all endpoints
        ├── api.go            Reads the request, calls the calculator, writes the answer
        └── middleware.go     CORS and body size limit
```

The math lives apart from the HTTP code, so each part can be read and tested on its own.
