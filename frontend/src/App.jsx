import React, { useState } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client using Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('Medium');
  const [travelStyle, setTravelStyle] = useState('Adventure');
  const [days, setDays] = useState(3);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setItinerary(null);
    try {
      // 1. Call FastAPI backend to generate itinerary using Gemini
      const res = await axios.post('http://localhost:8000/generate-itinerary', {
        destination,
        budget,
        travel_style: travelStyle,
        days: parseInt(days)
      });
      const itineraryData = res.data;
      setItinerary(itineraryData);

      // 2. Automatically save generated itinerary to Supabase database
      setSaving(true);
      const { error } = await supabase.from('itineraries').insert([
        {
          destination: itineraryData.destination,
          budget,
          travel_style: travelStyle,
          days: parseInt(days),
          itinerary_data: itineraryData
        }
      ]);

      if (error) {
        console.error('Error saving to Supabase:', error.message);
      } else {
        console.log('Itinerary successfully saved to Supabase!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate or save itinerary.');
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '700px', margin: 'auto' }}>
      <h2>AI Travel Itinerary Planner</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label>Destination: </label>
          <input value={destination} onChange={e => setDestination(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>Budget Level: </label>
          <select value={budget} onChange={e => setBudget(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label>Travel Style: </label>
          <input value={travelStyle} onChange={e => setTravelStyle(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>Number of Days: </label>
          <input type="number" value={days} onChange={e => setDays(e.target.value)} min="1" max="10" required style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {loading ? 'Generating Itinerary...' : 'Generate Itinerary'}
        </button>
      </form>

      {saving && <p style={{ color: 'green', fontSize: '14px' }}>Saving itinerary to Supabase database...</p>}

      {itinerary && (
        <div style={{ marginTop: '30px', background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
          <h3>{itinerary.destination} Itinerary</h3>
          <p><strong>Overview:</strong> {itinerary.overview}</p>
          {itinerary.daily_plans?.map((plan) => (
            <div key={plan.day} style={{ marginTop: '15px', background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <h4>Day {plan.day} (Est. Cost: {plan.estimated_cost})</h4>
              <ul>
                {plan.activities.map((act, index) => (
                  <li key={index}>{act}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}