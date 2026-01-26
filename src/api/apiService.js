import axios from "axios";


const WEATHER_API_URL = import.meta.env.VITE_WEATHER_API_URL;
const AIBOT_API_URL = import.meta.env.VITE_AIBOT_API_URL;
const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL;
const TRANSCRIBE_API_URL = import.meta.env.VITE_TRANSCRIBE_API_URL;
const TTS_API_URL = import.meta.env.VITE_TTS_API_URL;

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


const getDemoWeatherData = (selectedDistrict) => {
  const now = new Date();
  const districtName = selectedDistrict || "Your Location";

  // Helper to create Beckn tags
  const createTags = (loc, min, max, hum, wind) => [
    {
      list: [
        { descriptor: { code: "Location" }, value: loc },
        { descriptor: { code: "Min-Temp" }, value: min },
        { descriptor: { code: "Max-Temp" }, value: max },
        { descriptor: { code: "Humidity" }, value: hum },
        { descriptor: { code: "Wind-Speed" }, value: wind },
      ],
    },
  ];

  // Create current weather item
  const currentItem = {
    descriptor: {
      name: "Current Weather",
      short_desc: "Sunny",
      long_desc: `Temperature: 28°C, Humidity: 45%, Wind Speed: 12 m/s`
    },
    tags: createTags(districtName, "22", "34", "45%", "12 km/h"),
  };

  const items = [currentItem];

  // Create 5-day forecast
  for (let i = 1; i <= 5; i++) {
    const forecastDate = new Date(now);
    forecastDate.setDate(now.getDate() + i);
    const dateStr = forecastDate.toISOString().split("T")[0];

    // Morning forecast
    items.push({
      descriptor: {
        name: `Forecast for ${dateStr} 09:00:00`,
        short_desc: "Clear",
        long_desc: `Temperature: 24°C, Humidity: 50%, Wind Speed: 10 m/s`
      },
      tags: [
        {
          list: [
            { descriptor: { code: "Temperature" }, value: "24" },
            { descriptor: { code: "Humidity" }, value: "50%" },
            { descriptor: { code: "Wind-Speed" }, value: "10 km/h" },
          ],
        },
      ],
    });

    // Evening forecast
    items.push({
      descriptor: {
        name: `Forecast for ${dateStr} 18:00:00`,
        short_desc: "Partly Cloudy",
        long_desc: `Temperature: 32°C, Humidity: 40%, Wind Speed: 15 m/s`
      },
      tags: [
        {
          list: [
            { descriptor: { code: "Temperature" }, value: "32" },
            { descriptor: { code: "Humidity" }, value: "40%" },
            { descriptor: { code: "Wind-Speed" }, value: "15 km/h" },
          ],
        },
      ],
    });
  }

  return items;
};

const getDemoSchemesData = () => {
  return [
    {
      id: "demo-pmfby",
      title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      description: "A crop insurance scheme that integrates multiple stakeholders on a single platform.",
      benefits: "Financial support for crop loss",
      eligibility: "All farmers growing notified crops"
    },
    {
      id: "demo-kcc",
      title: "Kisan Credit Card (KCC)",
      description: "Provides adequate and timely credit support to farmers from the banking system.",
      benefits: "Low interest rate loans",
      eligibility: "Farmers, Tenant Farmers, Share Croppers"
    },
    {
      id: "demo-pm-kisan",
      title: "PM KISAN",
      description: "Income support of Rs 6000 per year to all land holder farmer families.",
      benefits: "Direct cash transfer",
      eligibility: "Small and marginal farmers"
    },
    {
      id: "demo-shc",
      title: "Soil Health Card Scheme",
      description: "To help farmers make judicious use of fertilizers based on soil nutrients.",
      benefits: "Soil testing and recommendations",
      eligibility: "All landholding farmers"
    }
  ];
};


export const fetchWeather = async (selectedDistrict) => {
  if (!selectedDistrict) {
    console.warn("No location selected for weather fetch");
    return getDemoWeatherData("Anantapur");
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
    const rawItems = response.data?.responses?.[0]?.message?.catalog?.providers?.[0]?.items || [];

    if (rawItems.length === 0) {
      console.warn("API returned no weather data. Falling back to demo data.");
      return getDemoWeatherData(selectedDistrict);
    }

    // Sanitize items to match UI expectations:
    // 1. "Current Weather" (or non-forecast item) should be at index 0.
    // 2. All subsequent items must contain "Forecast for ".

    // Find valid forecasts
    const forecasts = rawItems.filter(item => item?.descriptor?.name?.includes("Forecast for "));
    // Find current weather (any item that isn't a forecast)
    const current = rawItems.find(item => !item?.descriptor?.name?.includes("Forecast for "));

    const sanitizedItems = [];
    if (current) {
      sanitizedItems.push(current);
    }
    // Append forecasts
    sanitizedItems.push(...forecasts);

    // Fallback if sanitization results in empty data
    if (sanitizedItems.length === 0) {
      return getDemoWeatherData(selectedDistrict);
    }

    // CRITICAL: Augment items with short_desc/long_desc if they are missing but required by UI components
    sanitizedItems.forEach(item => {
      if (!item.descriptor.short_desc || !item.descriptor.long_desc) {
        const tags = item.tags?.[0]?.list || [];
        const temp = tags.find(t => t.descriptor.code === "Temperature")?.value ||
          tags.find(t => t.descriptor.code === "Max-Temp")?.value || "N/A";
        const hum = tags.find(t => t.descriptor.code === "Humidity")?.value || "N/A";
        const wind = tags.find(t => t.descriptor.code === "Wind-Speed")?.value || "N/A";

        item.descriptor.short_desc = item.descriptor.short_desc || "Clear";
        item.descriptor.long_desc = item.descriptor.long_desc || `Temperature: ${temp}°C, Humidity: ${hum}, Wind Speed: ${wind}`;
      }
    });

    console.log("weather", sanitizedItems)
    return sanitizedItems;
  } catch (error) {
    console.error("Error fetching weather, falling back to demo data:", error);
    return getDemoWeatherData(selectedDistrict);
  }
};

export const fetchSchemes = async () => {
  try {
    const response = await axios.post(
      SEARCH_API_URL + "schemaui",
      {},
      { headers: { "Content-Type": "application/json" } }
    );
    const schemes = response.data?.data?.scheme_cache_data || [];
    if (schemes.length === 0) {
      console.warn("API returned no schemes. Falling back to demo data.");
      return getDemoSchemesData();
    }
    return schemes;
  } catch (error) {
    console.error("Error fetching schemes, falling back to demo data:", error);
    return getDemoSchemesData();
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
    let errorMsg = "An error occurred. Please try again later.";

    // Check if it's a specific mock-like query we can handle with better info
    if (query.toLowerCase().includes("weather")) {
      errorMsg = "I see you're asking about the weather. You can use the 'Weather' service from the main menu for detailed updates.";
    } else if (query.toLowerCase().includes("scheme")) {
      errorMsg = "I can help you find government schemes. Please check the 'Government Schemes' section in the main menu.";
    }

    setMessages((prev) => {
      const updatedMessages = prev.slice(0, -1);
      return [
        ...updatedMessages,
        { text: errorMsg, sender: "bot" },
      ];
    });
  } finally {
    setLoading(false);
  }
};
