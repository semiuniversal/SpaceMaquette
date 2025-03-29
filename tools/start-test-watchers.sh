#!/bin/bash
# Start both test watchers simultaneously

# Start UI tests in a new terminal
gnome-terminal --tab -- bash -c "cd \"$(dirname \"$0\")/../space-maquette-ui\" && npm run test:watch; exec bash"

# Start server tests in a new terminal
gnome-terminal --tab -- bash -c "cd \"$(dirname \"$0\")/../space-maquette-server\" && npm run test:watch; exec bash" 