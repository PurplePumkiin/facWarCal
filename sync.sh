#!/bin/bash

# Set the directory where git pull will be executed
repo_directory="/var/www/facWarCal"

# Set the path to the log file
log_file="$repo_directory/sync.txt"

# Infinite loop
while true; do
    # Run git pull and append the output to the log file
    git -C "$repo_directory" pull >> "$log_file" 2>&1

    # Sleep for ten seconds
    sleep 10
done