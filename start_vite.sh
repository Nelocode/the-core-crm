#!/bin/bash
./node_modules/.bin/vite --port 5174 --host > vite_output.log 2>&1 &
echo $! > vite_pid.txt
