#!/usr/bin/python

from OpenSSL import SSL
import json

from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello():
    return "Annotator-store plugin http calls to neo4j"

@app.route("/search")
def hello():
    return json.dumps([])

if __name__ == "__main__":
    ctx = SSL.Context(SSL.SSLv23_METHOD)
    fcrt = 'server.crt'
    fkey = 'server.key'
    ctx.use_privatekey_file (fkey)
    ctx.use_certificate_file(fcrt)
    app.run(host='0.0.0.0', port=5000, ssl_context=ctx)
