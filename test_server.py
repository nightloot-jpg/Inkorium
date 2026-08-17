import http.server
import socketserver
import sys

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/assets/'):
            pass
        else:
            self.path = '/index.html'
        return super().do_GET()

PORT = 8080
Handler = RequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
