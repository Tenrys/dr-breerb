#!/bin/bash

cd /home/tenrys/dr-breerb
git pull origin master
while [ 1 ]; do
	node index.js
done
