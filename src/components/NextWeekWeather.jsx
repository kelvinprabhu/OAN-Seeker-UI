import React, { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import WeatherDetailPopup from "./NextWeekWeatherDetailPopup";
import { useTranslation } from "react-i18next";
import SunnyIcon from "../assets/Sunny.svg";
import ClearWeatherIcon from "../assets/clearweather.svg";
import RainyWeatherIcon from "../assets/rainyweather.svg";

const NextWeekWeather = ({ weatherData }) => {
  const { t } = useTranslation();
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(3);

  if (!weatherData || weatherData.length === 0) return null;

  const currentWeather = weatherData[0];
  const currentDate = currentWeather?.tags?.[0]?.descriptor?.code;

  const forecastItems = weatherData.filter((item) => {
    if (!item.descriptor.name.startsWith("Forecast")) return false;
    const parts = item.descriptor.name.split(" ");
    if (parts.length < 4) return false;
    const forecastDate = parts[2];
    return forecastDate !== currentDate;
  });

  const groupedForecasts = forecastItems.reduce((acc, forecast) => {
    const parts = forecast.descriptor.name.split(" ");
    const forecastDate = parts[2];
    if (!acc[forecastDate]) acc[forecastDate] = [];
    acc[forecastDate].push(forecast);
    return acc;
  }, {});

  const forecastDates = Object.keys(groupedForecasts).sort();

  const dailyForecasts = forecastDates.map((dateKey) => {
    const forecasts = groupedForecasts[dateKey];
    let bestForecast = forecasts[0];
    let minDiff = Number.MAX_VALUE;

    forecasts.forEach((fc) => {
      const parts = fc.descriptor.name.split(" ");
      const hour = parseInt(parts[3]?.split(":")[0], 10) || 0;
      const diff = Math.abs(hour - 12);
      if (diff < minDiff) {
        minDiff = diff;
        bestForecast = fc;
      }
    });
    return { date: dateKey, forecast: bestForecast };
  });

  const displayForecasts = dailyForecasts.slice(0, selectedTab);

  const getWeatherIcon = (weatherDescription, temperature) => {
    const description = weatherDescription.toLowerCase();

    if (
      description.includes("rain") ||
      description.includes("shower") ||
      description.includes("thunderstorm")
    ) {
      return RainyWeatherIcon;
    }

    if (description.includes("cloud") || description.includes("clear")) {
      return ClearWeatherIcon;
    }

    if (description.includes("snow") || description.includes("mist")) {
      return ClearWeatherIcon; // Adjust if needed
    }

    if (description.includes("sunny") || temperature >= 30) {
      return SunnyIcon;
    }

    return ClearWeatherIcon; // Default icon
  };

  return (
    <Box
      sx={{
        border: "1px solid #f7e6c4",
        borderRadius: "12px",
        padding: "16px",
        mt: 3,
      }}
    >
      <Tabs
        value={selectedTab}
        onChange={(event, newValue) => setSelectedTab(newValue)}
        textColor="inherit"
        indicatorColor="inherit"
        TabIndicatorProps={{ style: { backgroundColor: "#000000" } }}
        sx={{ color: "#000000" }}
      >
        <Tab
          label={t("nextWeekWeather.next3Days", "Next 3 days")}
          value={3}
          sx={{ textTransform: "none", color: "#000000" }}
        />
        <Tab
          label={t("nextWeekWeather.next5Days", "Next 5 days")}
          value={5}
          sx={{ textTransform: "none", color: "#000000" }}
        />
      </Tabs>

      {displayForecasts.map((item, index) => {
        const temperatureObj = item.forecast.tags?.[0]?.list?.find(
          (t) => t.descriptor.code === "Temperature"
        );
        const temperature = temperatureObj && temperatureObj.value !== "N/A"
          ? parseFloat(temperatureObj.value)
          : null;
        const dateObj = new Date(item.date);

        const dayNameEnglish = dateObj.toLocaleDateString("en-US", {
          weekday: "long",
        });
        const translatedDayName = t(
          `days.${dayNameEnglish.toLowerCase()}`,
          dayNameEnglish
        );

        const monthShortEnglish = dateObj.toLocaleDateString("en-US", {
          month: "short",
        });
        const translatedMonthShort = t(
          `monthsShort.${monthShortEnglish.toLowerCase()}`,
          monthShortEnglish
        );

        const dayOfMonth = dateObj.getDate();

        const weatherDescription = item.forecast.descriptor.short_desc || "Clear";
        const iconUrl = getWeatherIcon(weatherDescription, temperature);

        return (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              py: 1,
              cursor: "pointer",
            }}
            onClick={() => {
              setSelectedForecast(item.forecast);
              setSelectedDate(item.date);
              setPopupOpen(true);
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background:
                  "linear-gradient(179.04deg, #D2E2F6 -245.76%, #FCFDFE 132.78%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 2,
              }}
            >
              <img
                src={iconUrl}
                alt={weatherDescription}
                style={{ width: "40px", height: "40px" }}
              />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  marginRight: 3,
                }}
              >
                {temperature !== null
                  ? `${temperature.toFixed(0)}°C`
                  : weatherDescription}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "14px", color: "#555" }}>
                {translatedDayName} {dayOfMonth} {translatedMonthShort}
              </Typography>
            </Box>
          </Box>
        );
      })}

      <WeatherDetailPopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        forecast={selectedForecast}
        allForecastData={weatherData}
        initialDate={selectedDate}
      />
    </Box>
  );
};

export default NextWeekWeather;
