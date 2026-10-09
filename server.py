"""
Via Tours & Travels — Local Development SPA Server
Translates SPA History API routes and clean URLs to index.html or admin.html.
"""
import http.server
import os
import sys
from functools import partial

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
PORT = 3000

class SPARequestHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split('?')[0].split('#')[0]
        if clean == '/admin' or clean.startswith('/admin/'):
            return os.path.join(self.directory, 'admin.html')

        # Real file on disk?
        standard_path = super().translate_path(clean)
        if os.path.exists(standard_path) and not os.path.isdir(standard_path):
            return standard_path

        # File with .html suffix?
        if os.path.exists(standard_path + '.html'):
            return standard_path + '.html'

        # Default fallback to index.html for SPA History API routes
        return os.path.join(self.directory, 'index.html')

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    handler = partial(SPARequestHandler, directory=DIRECTORY)
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"Via Tours SPA Dev Server running at http://127.0.0.1:{port}/", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
