# Weather API Documentation

This document outlines the structure and usage of the Weather API integration within the OAN Seeker UI application.

## Overview

The application fetches weather data (current conditions and 5-day forecast) based on a user-selected district. It is designed to consume an API that follows a specific nested schema (likely inspired by Beckn/ONDC protocols).

## Configuration

The API endpoint is configured in the `.env` file:

```ini
VITE_WEATHER_API_URL=http://your-weather-api-endpoint.com/api/weather
```

If this variable is missing or empty, the application automatically falls back to generating **static demo data** for testing purposes.

## Request Structure

*   **Method**: `POST`
*   **Headers**: 
    *   `Content-Type`: `application/json`
*   **Body**:

```json
{
  "location": "DistrictName"
}
```

## Response Structure

The UI expects a deeply nested JSON response. The core data is located in `responses[0].message.catalog.providers[0].items`.

### Schema

```json
{
  "responses": [
    {
      "message": {
        "catalog": {
          "providers": [
            {
              "items": [
                {
                    "descriptor": { "name": "Current Weather" },
                    "tags": [ { "list": [ ... ] } ]
                },
                {
                    "descriptor": { "name": "Forecast for YYYY-MM-DD HH:MM:SS" },
                    "tags": [ { "list": [ ... ] } ]
                }
              ]
            }
          ]
        }
      }
    }
  ]
}
```

### Data Details

#### 1. Current Weather Item
The **first item** in the array is typically treated as the current weather.

*   **Descriptor Name**: `"Current Weather"`
*   **Required Tags** (in `tags[0].list`):
    *   `Location`: Name of the location (e.g., "Pune").
    *   `Min-Temp`: Minimum temperature (e.g., "22").
    *   `Max-Temp`: Maximum temperature (e.g., "34").
    *   `Humidity`: Humidity percentage (e.g., "45%").
    *   `Wind-Speed`: Wind speed (e.g., "12 km/h").

**Example Item:**
```json
{
  "descriptor": { "name": "Current Weather" },
  "tags": [
    {
      "list": [
        { "descriptor": { "code": "Location" }, "value": "Pune" },
        { "descriptor": { "code": "Min-Temp" }, "value": "22" },
        { "descriptor": { "code": "Max-Temp" }, "value": "34" },
        { "descriptor": { "code": "Humidity" }, "value": "45%" },
        { "descriptor": { "code": "Wind-Speed" }, "value": "12 km/h" }
      ]
    }
  ]
}
```

#### 2. Forecast Items
Subsequent items represent forecast data points. The UI groups these by date based on the descriptor name.

*   **Descriptor Name Ref**: `"Forecast for <YYYY-MM-DD> <HH:MM:SS>"`
*   **Required Tags** (in `tags[0].list`):
    *   `Temperature`: Forecasted temperature.
    *   `Humidity`: Forecasted humidity.
    *   `Wind-Speed`: Forecasted wind speed.

**Example Item:**
```json
{
  "descriptor": { "name": "Forecast for 2023-10-27 09:00:00" },
  "tags": [
    {
      "list": [
        { "descriptor": { "code": "Temperature" }, "value": "24" },
        { "descriptor": { "code": "Humidity" }, "value": "50%" },
        { "descriptor": { "code": "Wind-Speed" }, "value": "10 km/h" }
      ]
    }
  ]
}
```

## Mock Data / Fallback

To facilitate testing without a live backend, the `apiService.js` includes a `getDemoWeatherData` function.

**Triggers for Mock Data:**
1.  `VITE_WEATHER_API_URL` is undefined in `.env`.
2.  The API request fails (network error, 500 status, etc.).
3.  No location is provided.

The mock data dynamically generates a 5-day forecast starting from the current system date.
