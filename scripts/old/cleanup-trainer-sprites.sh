#!/bin/bash

# Clean up duplicate trainer sprites (remove flat PNG files, keep organized directories)
echo "Cleaning up trainer sprite structure..."

cd public/sprites/trainers/

# Remove flat PNG files that have corresponding directories
for png_file in *.png; do
    trainer_name=$(basename "$png_file" .png)
    if [ -d "$trainer_name" ]; then
        echo "Removing duplicate: $png_file (directory $trainer_name exists)"
        rm "$png_file"
    fi
done

echo "Trainer sprite cleanup complete"