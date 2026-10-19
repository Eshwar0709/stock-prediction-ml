
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [stockSymbol, setStockSymbol] = useState("AAPL");
  const [predictionDays, setPredictionDays] = useState("7");
  const [apiStatus, setApiStatus] = useState("Checking...");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkApi() {
      try {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) throw new Error("API request failed");

        const data = await response.json();

        if (!cancelled) {
          setApiStatus(
            data.status === "healthy" ? "Connected" : "Unavailable"
          );
        }
      } catch {
        if (!cancelled) setApiStatus("Disconnected");
      }
    }

    checkApi();
    const intervalId = setInterval(checkApi, 10000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      setHistory([]);

      try {
        const response = await fetch(
          `${API_URL}/api/stocks/${stockSymbol}/history`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            typeof data.detail === "string"
              ? data.detail
              : "Unable to load historical stock data."
          );
        }

        if (!cancelled) {
          setHistory(data.history || []);
        }
      } catch (err) {
        if (!cancelled) {
          setHistoryError(
            err.message || "Could not load historical stock data."
          );
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [stockSymbol]);

  async function generatePrediction() {
    setLoading(true);
    setError("");
    setPrediction(null);

    try {
      const response = await fetch(
        `${API_URL}/api/stocks/${stockSymbol}/predict?days=${predictionDays}`
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("The backend returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to generate prediction. Please try again."
        );
      }

      setPrediction(data);
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the backend. Check whether the API is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>
          Stock<span>Predict</span>
        </h2>

        <nav>
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#history">Historical Prices</a>
          <a href="#prediction">Stock Prediction</a>
          <a href="#results">Prediction Results</a>
          <a href="#about">About Project</a>
        </nav>

        <p className="sidebar-footer">Machine Learning Project</p>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">MACHINE LEARNING</p>
            <h1>Stock Market Dashboard</h1>
            <p className="subtitle">
              Explore historical stock prices and generate experimental forecasts.
            </p>
          </div>

          <span className="status">● API {apiStatus}</span>
        </header>

        <section className="welcome-card">
          <div>
            <p className="eyebrow">STOCK ANALYSIS</p>
            <h2>Explore stock price trends</h2>
            <p>
              Choose a stock, review its historical prices, and explore model estimates.
            </p>
          </div>

          <div className="chart-icon">↗</div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <p>Selected Stock</p>
            <h2>{stockSymbol}</h2>
            <span>Stock symbol</span>
          </article>

          <article className="stat-card">
            <p>Prediction Period</p>
            <h2>{predictionDays} Days</h2>
            <span>Forecast duration</span>
          </article>

          <article className="stat-card">
            <p>Model Status</p>
            <h2>
              {loading
                ? "Training..."
                : prediction
                ? "Completed"
                : "Ready"}
            </h2>
            <span>
              {prediction
                ? `${prediction.test_samples} historical test samples evaluated`
                : "Random Forest model"}
            </span>
          </article>
        </section>

        <section className="panel" id="history">
          <p className="eyebrow">HISTORICAL DATA</p>
          <h2>{stockSymbol} Closing Prices</h2>
          <p className="panel-description">
            Daily closing prices from approximately the past year. These are
            historical observations, not future predictions.
          </p>

          {historyLoading && (
            <p>Loading historical stock prices...</p>
          )}

          {historyError && (
            <p role="alert" className="error-message">
              {historyError}
            </p>
          )}

          {!historyLoading && !historyError && history.length > 0 && (
            <>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={history}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      minTickGap={35}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `$${Number(value).toFixed(2)}`,
                        "Closing price",
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="close"
                      name="Closing price"
                      stroke="#4f7cff"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="panel-description">
                {history.length} daily records loaded for {stockSymbol}.
              </p>
            </>
          )}
        </section>

        <section className="panel" id="prediction">
          <h2>Configure Stock Prediction</h2>
          <p className="panel-description">
            Choose your stock and how far ahead you want to predict.
          </p>

          <div className="form-grid">
            <label>
              Stock Symbol
              <select
                value={stockSymbol}
                onChange={(event) => {
                  setStockSymbol(event.target.value);
                  setPrediction(null);
                  setError("");
                }}
              >
                <option value="AAPL">Apple (AAPL)</option>
                <option value="GOOGL">Alphabet (GOOGL)</option>
                <option value="MSFT">Microsoft (MSFT)</option>
                <option value="TSLA">Tesla (TSLA)</option>
                <option value="AMZN">Amazon (AMZN)</option>
              </select>
            </label>

            <label>
              Prediction Period
              <select
                value={predictionDays}
                onChange={(event) => setPredictionDays(event.target.value)}
              >
                <option value="7">7 Trading Days</option>
                <option value="14">14 Trading Days</option>
                <option value="30">30 Trading Days</option>
              </select>
            </label>
          </div>

          <button
            className="predict-button"
            onClick={generatePrediction}
            disabled={loading}
          >
            {loading
              ? "Generating Prediction..."
              : "Generate Prediction →"}
          </button>

          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
        </section>

        {prediction && (
          <section className="panel" id="results">
            <p className="eyebrow">FORECAST RESULTS</p>
            <h2>{prediction.symbol} Stock Prediction</h2>
            <p className="panel-description">
              Experimental estimates for the next {prediction.prediction_days} trading days.
            </p>

            <div className="stats-grid">
              <article className="stat-card">
                <p>Latest Closing Price</p>
                <h2>${prediction.latest_close.toFixed(2)}</h2>
                <span>Historical market data</span>
              </article>

              <article className="stat-card">
                <p>Model MAE</p>
                <h2>${prediction.model_mae.toFixed(2)}</h2>
                <span>Historical test error in dollars</span>
              </article>

              <article className="stat-card">
                <p>Baseline MAE</p>
                <h2>${prediction.baseline_mae.toFixed(2)}</h2>
                <span>Historical error for the no-change baseline</span>
              </article>
            </div>

            <h3>Predicted Closing Prices</h3>

            <div className="table-container">
              <table className="forecast-table">
                <thead>
                  <tr>
                    <th>Trading Day</th>
                    <th>Predicted Close</th>
                    <th>Predicted Change</th>
                  </tr>
                </thead>

                <tbody>
                  {prediction.forecasts.map((forecast) => (
                    <tr key={forecast.day}>
                      <td>Day {forecast.day}</td>
                      <td>${forecast.predicted_close.toFixed(2)}</td>
                      <td
                        className={
                          forecast.predicted_return_percent >= 0
                            ? "positive-change"
                            : "negative-change"
                        }
                      >
                        {forecast.predicted_return_percent > 0 ? "+" : ""}
                        {forecast.predicted_return_percent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="panel-description">
              Evaluation used {prediction.test_samples} historical test samples.
              {prediction.model_mae < prediction.baseline_mae
                ? " The model had lower MAE than the baseline on this test."
                : prediction.model_mae === prediction.baseline_mae
                ? " The model and baseline had equal MAE on this test."
                : " The baseline had lower MAE than the model on this test."}
            </p>

            <p className="disclaimer">
              Predictions are experimental estimates, not guaranteed future
              prices or financial advice.
            </p>
          </section>
        )}

        <section className="panel" id="about">
          <h2>About This Project</h2>
          <p className="about-text">
            This project retrieves historical stock market data and uses a
            Random Forest regression model to estimate future stock prices.
            The model is evaluated against a simple no-change baseline using
            Mean Absolute Error (MAE). Predictions are experimental and are
            not financial advice.
          </p>
        </section>

        <footer>
          StockPredict · Academic Machine Learning Project
        </footer>
      </main>
    </div>
  );
}

export default App;
