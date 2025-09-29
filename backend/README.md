# Backend Setup

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set OpenAI API key:
```bash
export OPENAI_API_KEY="your-key-here"
```

4. Run server:
```bash
python main.py
```

Backend will run at http://localhost:8000
API docs at http://localhost:8000/docs