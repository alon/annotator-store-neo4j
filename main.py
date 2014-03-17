#!/usr/bin/python

from OpenSSL import SSL
import json

from flask import Flask

##### Globals
use_https = False
####

app = Flask(__name__)
app.debug = True

class Store(object):
    def __init__(self):
        self._annotations = ['ugabooga']
    def get_all(self):
        return self._annotations

store = Store()

@app.route("/")
def root():
    return "Annotator-store plugin http calls to neo4j"

@app.route("/search")
def search():
    return json.dumps(store.get_all())

@app.route("/annotations", methods=['GET', 'POST'])
def create():
    print("annotations")
    #import pdb; pdb.set_trace()
    return json.dumps([])

if __name__ == "__main__":
    ctx = None
    if use_https:
        ctx = SSL.Context(SSL.SSLv23_METHOD)
        fcrt = 'server.crt'
        fkey = 'server.key'
        ctx.use_privatekey_file (fkey)
        ctx.use_certificate_file(fcrt)
    app.run(host='127.0.0.1', port=5001, ssl_context=ctx)
