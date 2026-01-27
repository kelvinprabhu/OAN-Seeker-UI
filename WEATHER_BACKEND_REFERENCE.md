# Weather API Backend Reference

This document provides the request/response models and a complete reference implementation for the Weather API Backend. This backend is designed to work with the **OAN Seeker UI**.

## 1. API Specification

### Endpoint
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Model
The frontend sends a simple JSON object containing the location.

```json
{
  "location": "Pune"
}
```

### Response Model (Beckn/ONDC Style)
The frontend expects a deeply nested structure. The critical data lives inside `message.catalog.providers[0].items`.

```json
{
  "responses": [
    {
      "message": {
        "catalog": {
          "providers": [
            {
              "id": "weather-provider-1",
              "descriptor": { "name": "Weather Data Provider" },
              "items": [
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
                },
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
              ]
            }
          ]
        }
      }
    }
  ]
}
```

---

## 2. Reference Implementation (Python FastAPI)

The following is a complete, runnable backend server using **Python**, **FastAPI**, and **Pydantic**. This implementation generates dynamic data based on the requested location, matching the mock logic used in the UI.

### Prerequisites
```bash
pip install fastapi uvicorn
```

### Server Code (`weather_server.py`)

```python
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random

app = FastAPI(title="Weather API Backend")

# --- Pydantic Models for Request/Response ---

class WeatherRequest(BaseModel):
    location: str

class Descriptor(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None

class TagList(BaseModel):
    descriptor: Descriptor
    value: str

class Tag(BaseModel):
    list: List[TagList]

class Item(BaseModel):
    descriptor: Descriptor
    tags: List[Tag]

class Provider(BaseModel):
    id: str = "provider-default"
    descriptor: Descriptor = Descriptor(name="Default Weather Provider")
    items: List[Item]

class Catalog(BaseModel):
    providers: List[Provider]

class Message(BaseModel):
    catalog: Catalog

class ResponseObject(BaseModel):
    message: Message

class WeatherResponse(BaseModel):
    responses: List[ResponseObject]


# --- Helper to Generate Mock Data ---

def generate_mock_data(location_name: str) -> List[Item]:
    items = []
    
    # Randomize base values for variety
    base_temp = random.randint(20, 35)
    
    # 1. Current Weather
    current_weather_item = Item(
        descriptor=Descriptor(name="Current Weather"),
        tags=[
            Tag(list=[
                TagList(descriptor=Descriptor(code="Location"), value=location_name),
                TagList(descriptor=Descriptor(code="Min-Temp"), value=str(base_temp - 2)),
                TagList(descriptor=Descriptor(code="Max-Temp"), value=str(base_temp + 2)),
                TagList(descriptor=Descriptor(code="Humidity"), value=f"{random.randint(40, 70)}%"),
                TagList(descriptor=Descriptor(code="Wind-Speed"), value=f"{random.randint(5, 20)} km/h")
            ])
        ]
    )
    items.append(current_weather_item)
    
    # 2. 5-Day Forecast
    now = datetime.now()
    for i in range(5):
        future_date = now + timedelta(days=i)
        date_str = future_date.strftime("%Y-%m-%d")
        
        # Morning Forecast
        items.append(Item(
            descriptor=Descriptor(name=f"Forecast for {date_str} 09:00:00"),
            tags=[
                Tag(list=[
                    TagList(descriptor=Descriptor(code="Temperature"), value=str(base_temp + i - 1)),
                    TagList(descriptor=Descriptor(code="Humidity"), value=f"{random.randint(45, 65)}%"),
                    TagList(descriptor=Descriptor(code="Wind-Speed"), value=f"{random.randint(8, 15)} km/h")
                ])
            ]
        ))
        
        # Evening Forecast
        items.append(Item(
            descriptor=Descriptor(name=f"Forecast for {date_str} 18:00:00"),
            tags=[
                Tag(list=[
                    TagList(descriptor=Descriptor(code="Temperature"), value=str(base_temp + i - 3)),
                    TagList(descriptor=Descriptor(code="Humidity"), value=f"{random.randint(50, 80)}%"),
                    TagList(descriptor=Descriptor(code="Wind-Speed"), value=f"{random.randint(5, 12)} km/h")
                ])
            ]
        ))
        
    return items

# --- API Endpoint ---

@app.post("/api/weather", response_model=WeatherResponse)
async def get_weather(request: WeatherRequest):
    print(f"Received weather request for: {request.location}")
    
    # Generate the items
    items = generate_mock_data(request.location)
    
    # Construct the deep Beckn-style response structure
    response_structure = WeatherResponse(
        responses=[
            ResponseObject(
                message=Message(
                    catalog=Catalog(
                        providers=[
                            Provider(items=items)
                        ]
                    )
                )
            )
        ]
    )
    
    return response_structure

if __name__ == "__main__":
    # Runs on port 8001 to match default VITE env config
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

