import http.server, os

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # JS y CSS nunca se cachean en el navegador
        if self.path.endswith(('.js', '.css', '.html')):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.send_header('Pragma', 'no-cache')
        super().end_headers()
    def log_message(self, *args):
        pass  # silencia el log

os.chdir(os.path.dirname(os.path.abspath(__file__)))
http.server.test(HandlerClass=NoCacheHandler, port=3400, bind='127.0.0.1')
