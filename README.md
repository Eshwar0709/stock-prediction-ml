# Stock Prediction Using Machine Learning

A web-based stock analysis application that displays historical stock prices and generates experimental future price estimates using a Random Forest regression model.

## Features

- Historical daily closing-price chart
- Stock selection for Apple (AAPL), Alphabet (GOOGL), Microsoft (MSFT), Tesla (TSLA), and Amazon (AMZN)
- Forecast options for 7, 14, and 30 trading days
- Predicted closing prices and estimated percentage changes
- Model evaluation using Mean Absolute Error (MAE)
- Comparison against a simple no-change baseline
- React dashboard connected to a FastAPI backend

## Technology Stack

**Frontend**
- React
- Vite
- Recharts
- CSS

**Backend**
- Python
- FastAPI
- Uvicorn
- yfinance
- Pandas and NumPy

**Machine Learning**
- Scikit-learn
- Random Forest Regressor
- Mean Absolute Error (MAE)

## Project Structure

```text
StockPredictionML/
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── App.css
├── backend/
│   ├── main.py
│   └── ml_model.py
└── README.md
```

Other configuration files and dependencies are managed within the frontend and backend folders.

## How It Works

1. The user selects a supported stock and forecast period.
2. The FastAPI backend retrieves historical market data.
3. A Random Forest regression model learns patterns from historical returns and related features.
4. The model estimates future daily returns and converts them into estimated closing prices.
5. The dashboard displays historical prices, forecast results, and evaluation metrics.

## Running the Project Locally

### Prerequisites

- Python
- Node.js and npm
- Internet connection for retrieving stock market data

### Start the Backend

Open a terminal and run:

```powershell
cd C:\Users\meshw\StockPredictionML\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

If PowerShell blocks script execution, run this in that terminal before activating the environment:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Keep the backend terminal open.

### Start the Frontend

Open a second terminal:

```powershell
cd C:\Users\meshw\StockPredictionML\frontend
npm run dev
```

Open the local frontend address shown in the terminal, normally:

http://localhost:5173

The backend API documentation is available at:

http://127.0.0.1:8000/docs

## Evaluation

The model is evaluated using Mean Absolute Error (MAE) on a chronological historical test set. Its error is compared with a baseline that predicts no change from the previous closing price.

A lower MAE indicates a smaller average absolute prediction error on the evaluated data. The Random Forest model does not necessarily outperform the baseline for every stock or forecast horizon.

## Limitations

- Predictions are experimental estimates, not guaranteed future prices.
- Stock markets are affected by news, economic conditions, company performance, and many other factors not fully represented by the model.
- Historical patterns may not continue in the future.
- Forecast quality can vary by stock and prediction period.
- Market data availability depends on the external data provider.

## Disclaimer

This project is developed for academic and educational purposes only. It is not financial advice and should not be used as the sole basis for investment decisions.

## Future Improvements

- Compare additional machine learning models using appropriate time-series validation.
- Improve forecast evaluation across different time periods.
- Add more historical indicators and visualizations.
- Deploy the application so it can be accessed online.
