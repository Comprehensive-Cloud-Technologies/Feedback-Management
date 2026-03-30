#!/bin/bash
# Start PHP server in WSL with proper MySQL connection
cd /mnt/d/newlivefeedback/wholefeedback/cfs-backend-php

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Canteen Feedback System - PHP Development Server    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Starting PHP on 0.0.0.0:8000 (accessible from Windows)"
echo "URL: http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

# Start PHP server on all interfaces (so Windows can access it)
php -S 0.0.0.0:8000
