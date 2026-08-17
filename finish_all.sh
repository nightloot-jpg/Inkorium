#!/bin/bash
git add .
git commit -m "Submit Composer"
./pr_simulate.sh "Composer" "done"
