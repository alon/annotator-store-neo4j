#!/usr/bin/python

import os
from OpenSSL import SSL
import json

from flask import Flask, request, url_for

##### Globals
use_https = False
####

cwd = os.getcwd()
app = Flask(__name__)
app.debug = True

class Store(object):
    def __init__(self):
        self._annotations = {}
    def get_all(self):
        return self._annotations.values()

store = Store()

@app.route("/")
def root():
    return "Annotator-store plugin http calls to neo4j"

@app.route("/search")
def search():
    return json.dumps({'rows': store.get_all()})

@app.route("/annotations", methods=['GET', 'POST'])
def create():
    print("annotations: %r" % request.data)
    aid = len(store._annotations)
    store._annotations[aid] = json.loads(request.data)
    store._annotations[aid]['id'] = aid
    return json.dumps([])

@app.route("/annotations/<aid>", methods=['PUT'])
def update(aid):
    print("update: %r" % request.data)
    annotation = json.loads(request.data)
    store._annotations[aid] = annotation
    # the annotation is lacking the id, just like the create case.
    annotation['id'] = aid
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
