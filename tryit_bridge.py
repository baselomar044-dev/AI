
import http.server
import socketserver
import subprocess
import json
import os

PORT = 5000

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        command = data.get('command')
        print(f"Executing: {command}")
        
        try:
            # Execute command in shell
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            response = {
                'output': result.stdout,
                'error': result.stderr,
                'exitCode': result.returncode
            }
        except Exception as e:
            response = {'error': str(e), 'exitCode': 1}
            
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))

print(f"🚀 Try-It! Bridge running on http://localhost:{PORT}")
print("WARNING: This allows the AI to control your computer. Use with caution.")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
