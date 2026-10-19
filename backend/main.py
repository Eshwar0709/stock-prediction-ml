
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from ml_model import train_and_predict

app = FastAPI(
    title="Stock Prediction API",
    description="Backend for our Stock Prediction using Machine Learning project",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Stock Prediction API is running!",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/stocks")
def get_stocks():
    return {
        "stocks": [
            {"symbol": "AAPL", "name": "Apple"},
            {"symbol": "GOOGL", "name": "Alphabet"},
            {"symbol": "MSFT", "name": "Microsoft"},
            {"symbol": "TSLA", "name": "Tesla"},
            {"symbol": "AMZN", "name": "Amazon"}
        ]
    }


@app.get("/api/stocks/{symbol}/history")
def get_stock_history(symbol: str):
    allowed_symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
    symbol = symbol.upper()

    if symbol not in allowed_symbols:
        raise HTTPException(
            status_code=400,
            detail="Unsupported stock symbol"
        )

    try:
        stock = yf.Ticker(symbol)
        data = stock.history(period="1y", interval="1d")

        if data.empty:
            raise HTTPException(
                status_code=404,
                detail="No historical stock data found"
            )

        data = data.reset_index()

        records = []
        for _, row in data.iterrows():
            records.append({
                "date": row["Date"].strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"])
            })

        return {
            "symbol": symbol,
            "count": len(records),
            "history": records
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Could not retrieve stock data: {str(error)}"
        )

@app.get("/api/stocks/{symbol}/predict")
def predict_stock(symbol: str, days: int = 7):
    allowed_symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
    symbol = symbol.upper()

    if symbol not in allowed_symbols:
        raise HTTPException(
            status_code=400,
            detail="Unsupported stock symbol"
        )

    if days not in [7, 14, 30]:
        raise HTTPException(
            status_code=400,
            detail="Days must be 7, 14, or 30"
        )

    try:
        return train_and_predict(symbol, days)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Prediction failed: {str(error)}"
        )