# Copilot Instructions for AI Data Agent

## Project Overview
- **AI Data Agent** is a two-part app: a FastAPI backend (Python) and a React frontend (JavaScript).
- Users upload Excel/CSV files, ask natural language questions, and get answers with SQL and visualizations.
- The backend uses OpenAI to convert questions to SQL, runs queries on uploaded data, and returns results.
- The frontend handles file upload, question input, and displays results in tables and charts.

## Key Components
- `backend/main.py`: FastAPI app with endpoints for file upload (`/upload`), query (`/query`), and health check (`/health`).
- `frontend/src/App.js`: React app for user interaction, API calls, and rendering results.
- `sample_data/`: Example CSV files for demo/testing.

## Developer Workflows
- **Backend**
  - Create a virtual environment and install dependencies from `requirements.txt`.
  - Set `OPENAI_API_KEY` as an environment variable before running.
  - Start with `python main.py` (uses Uvicorn, runs on port 8000).
  - API docs available at `/docs` (Swagger UI).
- **Frontend**
  - Install dependencies with `npm install`.
  - Start with `npm start` (runs on port 3000, proxies API to backend).
- **Data Flow**
  - File upload → `/upload` → stored in SQLite (`data.db`), table name is random per upload.
  - Query → `/query` with `file_id` and question → OpenAI generates SQL → SQL runs on uploaded table → results returned.

## Patterns & Conventions
- All uploaded files are stored as new tables in SQLite, with sanitized column names.
- Only `.csv`, `.xlsx`, `.xls` files are accepted.
- OpenAI API key is required for query endpoint to work.
- Frontend expects backend at `http://localhost:8000` (see `API_BASE` in `App.js`).
- Chart rendering uses the first numeric column by default.
- Error messages from backend are surfaced in the frontend UI.

## Integration Points
- **OpenAI**: Used for natural language to SQL conversion in backend (`openai.ChatCompletion.create`).
- **SQLite**: Temporary storage for uploaded data, one table per file.
- **React/Chart.js**: For interactive data visualization in frontend.

## Examples
- Upload a file, then ask: "Show me the first 10 records" or "Count records by region".
- See generated SQL and chart in the frontend after query.

## References
- See `README.md` (root and backend) for setup and usage details.
- See `frontend/package.json` and `backend/requirements.txt` for dependencies.

---
For new features, follow the established API and data flow patterns. Keep backend stateless except for in-memory file tracking. Update this file if major conventions change.
