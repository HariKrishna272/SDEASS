from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import sqlite3
import google.generativeai as genai   # ✅ Gemini SDK
import os
from typing import Dict, Any
import uuid
import io
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AI Data Agent API",
    description="Upload Excel/CSV and query with natural language using Gemini 2.5",
    version="1.0.0"
)

# Allow all origins (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini with API Key
genai.configure(api_key=os.getenv("GEMINI_API_KEY", "your-gemini-key-here"))

uploaded_files = {}

@app.get("/")
async def root():
    return {"message": "AI Data Agent API (Gemini 2.5) - Ready!"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(('.xlsx', '.csv', '.xls')):
            raise HTTPException(status_code=400, detail="Only Excel and CSV files supported")

        contents = await file.read()

        # Load into pandas
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        # Clean up dataframe
        df = df.dropna(how='all').dropna(axis=1, how='all')
        df.columns = [str(col).strip().replace(' ', '_') for col in df.columns]
        df.columns = [f'column_{i+1}' if 'Unnamed' in str(col) else str(col) 
                      for i, col in enumerate(df.columns)]

        # Generate unique table name
        file_id = str(uuid.uuid4())[:8]
        table_name = f'table_{file_id}'

        # Save into SQLite
        conn = sqlite3.connect('data.db')
        df.to_sql(table_name, conn, if_exists='replace', index=False)
        conn.close()

        uploaded_files[file_id] = {
            'filename': file.filename,
            'columns': list(df.columns),
            'rows': len(df),
            'table_name': table_name
        }

        return {
            'file_id': file_id,
            'filename': file.filename,
            'columns': list(df.columns),
            'rows': len(df),
            'preview': df.head(5).to_dict('records')
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def process_query(request: Dict[str, Any]):
    try:
        file_id = request.get('file_id')
        question = request.get('question')

        if file_id not in uploaded_files:
            raise HTTPException(status_code=404, detail="File not found")

        file_info = uploaded_files[file_id]
        table_name = file_info['table_name']
        columns = file_info['columns']

        prompt = f"""Convert to SQL query:
        Table: {table_name}
        Columns: {', '.join(columns)}
        Question: {question}
        Return only SQL, limit 100 rows."""

        # ✅ Use Gemini 2.5 Flash
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)

        sql_query = response.text.strip()
        sql_query = sql_query.replace('```sql', '').replace('```', '').strip()

        # Run SQL query against SQLite
        conn = sqlite3.connect('data.db')
        result_df = pd.read_sql_query(sql_query, conn)
        conn.close()

        return {
            'sql_query': sql_query,
            'data': result_df.to_dict('records'),
            'columns': list(result_df.columns),
            'row_count': len(result_df)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "files": len(uploaded_files)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
