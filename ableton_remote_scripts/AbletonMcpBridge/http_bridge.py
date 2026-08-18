from __future__ import absolute_import, print_function

import json
import threading
import traceback

try:
    from http.server import BaseHTTPRequestHandler, HTTPServer
    from urllib.parse import parse_qs, urlparse
except ImportError:
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
    from urlparse import parse_qs, urlparse


MAX_BODY_BYTES = 1024 * 1024


class BridgeHttpError(Exception):
    def __init__(self, message, status_code=400):
        Exception.__init__(self, message)
        self.status_code = status_code


def start_http_server(host, port, bridge):
    server = HTTPServer((host, port), make_handler(bridge))
    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    return server, thread


def stop_http_server(server):
    if server is not None:
        server.shutdown()
        server.server_close()


def make_handler(bridge):
    class BridgeHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            self._handle("GET")

        def do_POST(self):
            self._handle("POST")

        def do_DELETE(self):
            self._handle("DELETE")

        def log_message(self, fmt, *args):
            return

        def _handle(self, method):
            try:
                parsed = urlparse(self.path)
                query = parse_qs(parsed.query)
                payload = self._read_json_body() if method in ("POST", "DELETE") else {}
                result = bridge.handle_request(method, parsed.path, query, payload)
                self._send_json(200, result)
            except BridgeHttpError as error:
                self._send_json(error.status_code, {"ok": False, "error": str(error)})
            except Exception as error:
                bridge._log(traceback.format_exc())
                self._send_json(500, {"ok": False, "error": "Internal bridge error: %s" % error})

        def _read_json_body(self):
            length = int(self.headers.get("Content-Length") or "0")
            if length > MAX_BODY_BYTES:
                raise BridgeHttpError(
                    "Request body is too large: maximum %s bytes, observed %s bytes" % (MAX_BODY_BYTES, length),
                    413
                )
            if length == 0:
                return {}
            raw_body = self.rfile.read(length)
            if isinstance(raw_body, bytes):
                raw_body = raw_body.decode("utf-8")
            try:
                return json.loads(raw_body)
            except ValueError:
                raise BridgeHttpError("Request body must be valid JSON")

        def _send_json(self, status_code, payload):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    return BridgeHandler
