#!/bin/bash

# AI Triage ML Service Startup Script

echo "🚀 Starting AI Triage ML Service..."
echo ""

# Navigate to ml-service directory
cd "$(dirname "$0")"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Start Flask server
echo ""
echo "🎯 Starting ML Service on http://localhost:5001"
echo "Press Ctrl+C to stop"
echo ""
python app.py
