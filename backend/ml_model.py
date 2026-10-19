
import yfinance as yf
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error


def train_and_predict(symbol: str, prediction_days: int = 7):
    data = yf.Ticker(symbol).history(period="5y", interval="1d")

    if data.empty or len(data) < 100:
        raise ValueError("Not enough historical data to train the model.")

    prices = data["Close"].astype(float).reset_index(drop=True)

    dataset = pd.DataFrame({"close": prices})

    # Recent closing prices and returns
    dataset["return_1"] = prices.pct_change()
    dataset["return_2"] = prices.pct_change(2)
    dataset["return_5"] = prices.pct_change(5)
    dataset["return_10"] = prices.pct_change(10)
    dataset["average_5"] = prices.pct_change().rolling(5).mean()
    dataset["volatility_10"] = prices.pct_change().rolling(10).std()

    # Predict the next trading day's percentage return
    dataset["target"] = prices.pct_change().shift(-1)

    feature_columns = [
        "return_1",
        "return_2",
        "return_5",
        "return_10",
        "average_5",
        "volatility_10"
    ]

    dataset = dataset.dropna()

    X = dataset[feature_columns]
    y = dataset["target"]

    split_index = int(len(dataset) * 0.8)

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]
    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    model = RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        min_samples_leaf=10,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    predicted_returns = model.predict(X_test)

    # Convert predicted returns into price estimates
    test_indices = dataset.index[split_index:]
    
    previous_prices = prices.iloc[test_indices].reset_index(drop=True)
    
    predicted_prices = previous_prices * (1 + predicted_returns)
    
    actual_prices = prices.iloc[test_indices + 1].reset_index(drop=True)

    model_mae = mean_absolute_error(actual_prices, predicted_prices)

    # Baseline predicts no change in the next day's price
    baseline_mae = mean_absolute_error(actual_prices, previous_prices)

    # Recursively forecast future trading sessions
    recent_prices = list(prices.tail(11))
    forecasts = []

    for day in range(1, prediction_days + 1):
        series = pd.Series(recent_prices, dtype=float)
        returns = series.pct_change().dropna()

        features = pd.DataFrame([{
            "return_1": returns.iloc[-1],
            "return_2": series.iloc[-1] / series.iloc[-3] - 1,
            "return_5": series.iloc[-1] / series.iloc[-6] - 1,
            "return_10": series.iloc[-1] / series.iloc[-11] - 1,
            "average_5": returns.tail(5).mean(),
            "volatility_10": returns.tail(10).std()
        }])

        predicted_return = float(model.predict(features[feature_columns])[0])

        # Limit extreme daily moves from the model
        predicted_return = max(-0.10, min(0.10, predicted_return))

        next_price = recent_prices[-1] * (1 + predicted_return)

        forecasts.append({
            "day": day,
            "predicted_close": round(next_price, 2),
            "predicted_return_percent": round(predicted_return * 100, 2)
        })

        recent_prices.append(next_price)

    return {
        "symbol": symbol,
        "latest_close": round(float(prices.iloc[-1]), 2),
        "prediction_days": prediction_days,
        "model_mae": round(float(model_mae), 2),
        "baseline_mae": round(float(baseline_mae), 2),
        "test_samples": len(y_test),
        "forecasts": forecasts
    }
