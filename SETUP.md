# Setup Guide

## Quick Start (5 minutes)

1. **Clone & Install**

git clone <repo-url>
cd memoryguard

2. **Backend Setup**

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

3. **Frontend Setup**

cd frontend
npm install

4. **Run**

Terminal 1
cd backend && python main.py

Terminal 2
cd frontend && npm start


## Troubleshooting
- API key errors → Check `.env` file
- Port conflicts → Change in `main.py` and React config
- Video upload fails → Check file size (<250MB recommended)

