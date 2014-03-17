annotator store to neo4j
========================
bridge between the regular store plugin of annotator to neo4j.

annotator 1.0 used despite annotator 2.0 being in the works reported to land in April.

Later needs to also be able to be used by hypothes.is instead of Elastic Search.

Installation
============

Install greasemonkey.

add a new user script, paste greasemonkey/annotator-everywhere.user.js contents there
 - for development better to use a symlink, only way is to create the script and then
   delete it and symlink to here.

run ./main.py

Bugs
====

Doesn't store the annotations.
