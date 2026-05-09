from __future__ import annotations

import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlparse

try:
    from .lp_solver import solve_complete
except ImportError:
    from lp_solver import solve_complete


HOST = "127.0.0.1"
PORT = 8000


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class ULPSSHandler(BaseHTTPRequestHandler):
    server_version = "ULPSSPython/1.0"

    def do_OPTIONS(self) -> None:
        json_response(self, HTTPStatus.NO_CONTENT, {})

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in {"/", "/api/health"}:
            json_response(self, HTTPStatus.OK, {"ok": True, "engine": "python"})
            return
        json_response(self, HTTPStatus.NOT_FOUND, {"error": "Route introuvable"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path != "/api/solve":
            json_response(self, HTTPStatus.NOT_FOUND, {"error": "Route introuvable"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(length).decode("utf-8")
            payload = json.loads(raw_body) if raw_body else {}
            problem = payload["problem"]
            method = payload.get("method", "auto")
            result = solve_complete(problem, method)
            json_response(self, HTTPStatus.OK, result)
        except Exception as exc:
            json_response(self, HTTPStatus.BAD_REQUEST, {"error": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:
        return


def run() -> None:
    server = ThreadingHTTPServer((HOST, PORT), ULPSSHandler)
    print(f"ULPSS Python backend running at http://{HOST}:{PORT}")
    print("Endpoints: GET /api/health, POST /api/solve")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping ULPSS Python backend")
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
