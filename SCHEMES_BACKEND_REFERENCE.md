# Schemes API Backend Reference

This document provides the request/response models and a complete reference implementation for the **Schemes API Backend**. This backend is designed to provide government scheme data to the **OAN Seeker UI**.

## 1. API Specification

### Endpoint Configuration
The frontend uses the URL defined in the `.env` file under `VITE_SEARCH_API_URL`.
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Model
The frontend sends an empty JSON object as the request body.

```json
{}
```

### Response Model
The frontend expects a specific nested JSON structure. The critical data lives inside `data.scheme_cache_data`, which must be an array of scheme objects.

**Key Fields used by UI:**
- `id`: Unique identifier for the scheme.
- `title`: The name of the scheme (used for search filtering).
- `description`: A brief summary of what the scheme offers.
- *Note: Additional fields may be rendered by the `SchemeCard` component.*

#### Example Response JSON
```json
{
  "data": {
    "scheme_cache_data": [
      {
        "id": "scheme-001",
        "title": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "description": "A crop insurance scheme that integrates multiple stakeholders on a single platform.",
        "benefits": "Financial support for crop loss",
        "eligibility": "All farmers growing notified crops"
      },
      {
        "id": "scheme-002",
        "title": "Kisan Credit Card (KCC)",
        "description": "Provides adequate and timely credit support to farmers from the banking system.",
        "benefits": "Low interest rate loans",
        "eligibility": "Farmers, Tenant Farmers, Share Croppers"
      }
    ]
  }
}
```

---

## 2. Reference Implementation (Python FastAPI)

The following is a complete, runnable backend server using **Python**, **FastAPI**, and **Pydantic**. This implementation serves static mock data matching the structure expected by the `fetchSchemes` function in `apiService.js`.

### Prerequisites
```bash
pip install fastapi uvicorn
```

### Server Code (`schemes_server.py`)

```python
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Schemes API Mock Server")

# --- Pydantic Models for Response ---

class SchemeItem(BaseModel):
    id: str
    title: str
    description: str
    benefits: Optional[str] = None
    eligibility: Optional[str] = None

class DataWrapper(BaseModel):
    scheme_cache_data: List[SchemeItem]

class SchemesResponse(BaseModel):
    data: DataWrapper

# --- Mock Data ---

MOCK_SCHEMES = [
    SchemeItem(
        id="1",
        title="Pradhan Mantri Krishi Sinchai Yojana",
        description="Har Khet ko Pani - expanding cultivable area under assured irrigation.",
        benefits="Improved irrigation access",
        eligibility="All farmers"
    ),
    SchemeItem(
        id="2",
        title="Soil Health Card Scheme",
        description="To help farmers make judicious use of fertilizers.",
        benefits="Soil testing and recommendations",
        eligibility="All landholding farmers"
    ),
    SchemeItem(
        id="3",
        title="Paramparagat Krishi Vikas Yojana",
        description="To promote organic farming and chemical-free agricultural production.",
        benefits="Financial assistance for organic inputs",
        eligibility="Farmers adopting organic farming"
    ),
    SchemeItem(
        id="4",
        title="PM KISAN",
        description="Income support of Rs 6000 per year to all land holder farmer families.",
        benefits="Direct cash transfer",
        eligibility="Small and marginal farmers"
    ),
    SchemeItem(
        id="5",
        title="National Agriculture Market (e-NAM)",
        description="Pan-India electronic trading portal which networks the existing APMC mandis.",
        benefits="Better price discovery",
        eligibility="Farmers registered with APMC"
    )
]

# --- API Endpoint ---

@app.post("/api/suggest/", response_model=SchemesResponse)
async def get_schemes():
    """
    Returns a list of government schemes in the structure expected by OAN Seeker UI.
    Ignores the request body.
    """
    return SchemesResponse(
        data=DataWrapper(
            scheme_cache_data=MOCK_SCHEMES
        )
    )

if __name__ == "__main__":
    # Runs on port 8001 to match default frontend configuration
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

## 3. Integration Steps

1.  **Run the Server**: Save the python code above to `schemes_server.py` and run it:
    ```bash
    python schemes_server.py
    ```
2.  **Configure Frontend**: Ensure your `.env` file in the UI project points to this server.
    ```env
    # .env
    VITE_SEARCH_API_URL=http://127.0.0.1:8001/api/suggest/
    ```
3.  **Verify**: Open the Schemes page in the UI. It should now load the data defined in `MOCK_SCHEMES`.
