import React, { useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE = 'http://localhost:8000';

function App() {
  const [fileInfo, setFileInfo] = useState(null);
  const [question, setQuestion] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/upload`, formData);
      setFileInfo(response.data);
      setError('');
    } catch (error) {
      setError('Upload failed: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const handleQuery = async () => {
    if (!fileInfo?.file_id || !question) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/query`, {
        file_id: fileInfo.file_id,
        question: question
      });
      setResults(response.data);
      setError('');
    } catch (error) {
      setError('Query failed: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const generateChart = () => {
    if (!results?.data?.length) return null;

    const numericCols = results.columns.filter(col => 
      results.data.some(row => !isNaN(Number(row[col])))
    );

    if (!numericCols.length) return <p>No numeric data for charts</p>;

    const chartData = {
      labels: results.data.slice(0, 10).map((row, i) => row[results.columns[0]] || `Row ${i+1}`),
      datasets: [{
        label: numericCols[0],
        data: results.data.slice(0, 10).map(row => Number(row[numericCols[0]]) || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      }]
    };

    return <div className="chart"><Bar data={chartData} /></div>;
  };

  const sampleQuestions = [
    "Show me the first 10 records",
    "Count total rows",
    "Show maximum values",
    "Group by first column"
  ];

  return (
    <div className="App">
      <header>
        <h1>🤖 AI Data Agent</h1>
        <p>Upload Excel files and ask questions</p>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="upload">
        <h2>Upload File</h2>
        <input type="file" onChange={handleFileUpload} accept=".xlsx,.csv,.xls" disabled={loading} />

        {fileInfo && (
          <div className="file-info">
            <h3>✅ {fileInfo.filename}</h3>
            <p>{fileInfo.rows} rows, {fileInfo.columns.length} columns</p>
            <p>Columns: {fileInfo.columns.join(', ')}</p>
          </div>
        )}
      </section>

      {fileInfo && (
        <section className="query">
          <h2>Ask Questions</h2>

          <div className="samples">
            {sampleQuestions.map((q, i) => (
              <button key={i} onClick={() => setQuestion(q)} className="sample-btn">
                {q}
              </button>
            ))}
          </div>

          <div className="query-input">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about your data..."
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            />
            <button onClick={handleQuery} disabled={loading || !question}>
              {loading ? 'Processing...' : 'Ask'}
            </button>
          </div>
        </section>
      )}

      {results && (
        <section className="results">
          <h2>Results ({results.row_count} rows)</h2>

          <div className="sql">
            <h3>SQL Query:</h3>
            <code>{results.sql_query}</code>
          </div>

          {generateChart()}

          <div className="table-container">
            <table>
              <thead>
                <tr>{results.columns.map(col => <th key={col}>{col}</th>)}</tr>
              </thead>
              <tbody>
                {results.data.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    {results.columns.map(col => <td key={col}>{row[col] ?? '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
