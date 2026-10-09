import http.server
import os

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        full_path = self.translate_path(self.path)
        if not os.path.exists(full_path) or (os.path.isdir(full_path) and not os.path.exists(os.path.join(full_path, 'index.html'))):
            self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), SPAHandler)
    print(f"Serving SPA at http://127.0.0.1:{PORT}", flush=True)
    server.serve_forever()
