from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import traceback
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY is not set in environment variables!")

genai.configure(api_key=api_key)

class ItineraryRequest(BaseModel):
    destination: str
    budget: str
    travel_style: str
    days: int

class DayPlan(BaseModel):
    day: int
    activities: list[str]
    estimated_cost: str

class ItineraryResponse(BaseModel):
    destination: str
    overview: str
    daily_plans: list[DayPlan]

@app.post("/generate-itinerary", response_model=ItineraryResponse)
def generate_itinerary(req: ItineraryRequest):
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = (
            f"Create a detailed {req.days}-day travel itinerary for {req.destination} "
            f"with a {req.budget} budget and {req.travel_style} travel style. "
            "Return the response strictly adhering to a JSON format containing 'destination', 'overview', "
            "and 'daily_plans' as an array of objects with 'day' (int), 'activities' (array of strings), and 'estimated_cost' (string)."
        )
        
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        import json
        data = json.loads(response.text)
        return data
    except Exception as e:
        print("--- ERROR OCCURRED ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))