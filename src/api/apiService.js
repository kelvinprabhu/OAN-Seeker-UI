import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";

const WEATHER_API_URL = import.meta.env.VITE_WEATHER_API_URL;
const AIBOT_API_URL = import.meta.env.VITE_AIBOT_API_URL || `${BASE_URL}/api/chat/`;
const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL || `${BASE_URL}/api/suggest/`;
const TRANSCRIBE_API_URL = import.meta.env.VITE_TRANSCRIBE_API_URL || `${BASE_URL}/api/transcribe/`;
const TTS_API_URL = import.meta.env.VITE_TTS_API_URL || `${BASE_URL}/api/tts/`;

const cleanResponseText = (text) => {
  const lines = text.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed === "[" || trimmed === "]") return false;
    if (/^```[a-zA-Z]*$/.test(trimmed)) return false;
    return true;
  });
  let cleaned = filtered.join("\n").trim();
  // Remove any .pdf occurrences (case-insensitive)
  cleaned = cleaned.replace(/\.pdf/gi, "");
  // Remove any "page# <number>" text
  cleaned = cleaned.replace(/page#\s*\d+/gi, "");
  return cleaned;
};

// Helper to generate demo weather data
const getDemoWeatherData = (location) => {
  const items = [];
  const today = new Date();

  // 1. Current Weather Item
  items.push({
    descriptor: { name: "Current Weather" },
    tags: [
      {
        list: [
          { descriptor: { code: "Location" }, value: location || "Demo Location" },
          { descriptor: { code: "Min-Temp" }, value: "22" },
          { descriptor: { code: "Max-Temp" }, value: "34" },
          { descriptor: { code: "Humidity" }, value: "45%" },
          { descriptor: { code: "Wind-Speed" }, value: "12 km/h" },
        ],
      },
    ],
  });

  // 2. Forecast Items (Next 5 days, morning and evening)
  for (let i = 0; i < 5; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const dateStr = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Morning Forecast
    items.push({
      descriptor: { name: `Forecast for ${dateStr} 09:00:00` },
      tags: [
        {
          list: [
            { descriptor: { code: "Temperature" }, value: (24 + i).toString() },
            { descriptor: { code: "Humidity" }, value: "50%" },
            { descriptor: { code: "Wind-Speed" }, value: "10 km/h" },
          ],
        },
      ],
    });

    // Evening Forecast
    items.push({
      descriptor: { name: `Forecast for ${dateStr} 18:00:00` },
      tags: [
        {
          list: [
            { descriptor: { code: "Temperature" }, value: (20 + i).toString() },
            { descriptor: { code: "Humidity" }, value: "60%" },
            { descriptor: { code: "Wind-Speed" }, value: "8 km/h" },
          ],
        },
      ],
    });
  }

  return items;
};

export const fetchWeather = async (selectedDistrict) => {
  if (!selectedDistrict) {
    console.warn("No location selected for weather fetch");
    return getDemoWeatherData("Unknown Location");
  }

  if (!WEATHER_API_URL) {
    console.warn("WEATHER_API_URL is not defined. Returning demo weather data.");
    return getDemoWeatherData(selectedDistrict);
  }

  try {
    const response = await axios.post(
      WEATHER_API_URL,
      { location: selectedDistrict },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data?.responses?.[0]?.message?.catalog?.providers?.[0]?.items || [];
  } catch (error) {
    console.error("Error fetching weather, falling back to demo data:", error);
    return getDemoWeatherData(selectedDistrict);
  }
};

export const fetchSchemes = async () => {
  try {
    const response = await axios.post(
      SEARCH_API_URL, 
      {},
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data?.data?.scheme_cache_data || [];
  } catch (error) {
    console.error("Error fetching schemes:", error);
    return [];
  }
};

// Helper to read streaming response
async function readStream(response, onUpdate) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let done = false;
  let text = "";

  while (!done) {
    const { value, done: isDone } = await reader.read();
    done = isDone;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      text += chunk;
      if (onUpdate) onUpdate(text);
    }
  }
  return text;
}

export const sendQueryToBot = async (
  query,
  lang,
  setMessages,
  setLoading,
  typingDots,
  audio
) => {
  setLoading(true);
  
  // Add initial "Typing..." or placeholder message
  setMessages((prev) => {
    if (prev.length > 0 && prev[prev.length - 1].text.startsWith("Typing")) {
      return prev;
    }
    return [
      ...prev,
      { text: "Typing" + typingDots, sender: "bot", isStreaming: true },
    ];
  });

  try {
    let textToChat = query;

    // 1. Transcribe audio if present (Still using Axios for this non-streaming part)
    if (audio) {
      try {
        const transcribeResponse = await axios.post(
          TRANSCRIBE_API_URL, 
          { 
            audio_content: audio,
            session_id: "session_" + Date.now() 
          },
          { headers: { "Content-Type": "application/json" } }
        );
        
        const tData = transcribeResponse.data;
        if (tData.status === 'error') {
           throw new Error(tData.message || "Transcription failed");
        }
        textToChat = tData.text;
        
        if (!textToChat) {
          throw new Error("Could not transcribe audio (no text returned).");
        }
      } catch (err) {
        console.error("Transcription error:", err);
        throw new Error("Failed to transcribe audio.");
      }
    }

    if (!textToChat) {
        throw new Error("No query provided.");
    }

    // 2. Send Chat Request (Using standard fetch for streaming support)
    const chatPayload = {
      query: textToChat,
      session_id: "session_" + Date.now(),
      source_lang: lang,
      target_lang: lang,
      user_id: "anonymous"
    };

    const response = await fetch(AIBOT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatPayload),
    });

    if (!response.ok) {
       throw new Error(`Bot API returned error: ${response.statusText}`);
    }

    // 3. Handle Streaming Response
    // We update the UI incrementally as data arrives
    let fullText = "";
    
    await readStream(response, (currentText) => {
        fullText = currentText;
        setMessages((prev) => {
            const updatedMessages = prev.slice(0, -1);
            return [
                ...updatedMessages,
                {
                    text: cleanResponseText(fullText), // Clean in real-time or just at end? cleanliness might be tricky during stream
                    sender: "bot",
                    isStreaming: true
                }
            ];
        });
    });

    // Final clean and update
    const finalCleanedText = cleanResponseText(fullText || "Sorry, I received an empty response.");

    setMessages((prev) => {
      const updatedMessages = prev.slice(0, -1);
      return [
        ...updatedMessages,
        {
          text: finalCleanedText,
          sender: "bot",
          isStreaming: false
        },
      ];
    });

    return { response: finalCleanedText }; 

  } catch (error) {
    console.error("Bot API Error:", error);
    setMessages((prev) => {
      const updatedMessages = prev.slice(0, -1);
      return [
        ...updatedMessages,
        { text: "An error occurred. Please try again later.", sender: "bot" },
      ];
    });
  } finally {
    setLoading(false);
  }
};
