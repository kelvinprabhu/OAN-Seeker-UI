import React, { useState, useContext } from "react";
import { Box, Typography, Divider, Grid } from "@mui/material";
import windIcon from "../assets/air.svg";
import humidityIcon from "../assets/humidity.svg";
import SunnyIcon from "../assets/Sunny.svg";
import ClearWeatherIcon from "../assets/clearweather.svg";
import RainyWeatherIcon from "../assets/rainyweather.svg";
import CurrentWeatherPopup from "./CurrentWeatherPopup";
import { useTranslation } from "react-i18next";
import { useReadableDay } from "./useReadableDay";
import { LocationContext } from "../context/LocationContext";

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
    return ClearWeatherIcon;
  }

  if (description.includes("sunny") || temperature >= 30) {
    return SunnyIcon;
  }

  return ClearWeatherIcon;
};

const CurrentWeather = ({ widgetData, allForecastData }) => {
  const { t } = useTranslation();
  const getReadableDay = useReadableDay();
  const [openPopup, setOpenPopup] = useState(false);
  const { location } = useContext(LocationContext); // consume location from context

  if (!widgetData || !widgetData[0])
    return <Box>{t("currentWeather.noData", "No data available")}</Box>;

  const descriptor = widgetData[0].descriptor || {};
  const short_desc = descriptor.short_desc || "Clear";
  const long_desc = descriptor.long_desc || "No detailed description available";

  const temperatureMatch = long_desc.match(/Temperature: ([\d.]+)°C/);
  const humidityMatch = long_desc.match(/Humidity: (\d+)%/);
  const windSpeedMatch = long_desc.match(/Wind Speed: ([\d.]+) m\/s/);

  const wholeTemperature = temperatureMatch
    ? parseInt(temperatureMatch[1])
    : "N/A";
  const wholeWindSpeed = windSpeedMatch
    ? Math.trunc(parseFloat(windSpeedMatch[1]) * 3.6)
    : "N/A";
  const humidity = humidityMatch ? humidityMatch[1] : "N/A";

  const forecastDate = widgetData[0].forecastDate || new Date().toISOString();
  const translatedDay = getReadableDay(forecastDate);

  // Extract location name from API response
  const locationNameFromApi = widgetData[0].tags?.[0]?.list.find(
    (tag) => tag.descriptor?.code === "location"
  )?.value;

  // Use district value from context as a fallback
  const locationName =
    locationNameFromApi || location.selectedDistrict || t("currentWeather.noLocation", "Location not available");

  const iconUrl = getWeatherIcon(short_desc, wholeTemperature);

  return (
    <>
      <Box
        onClick={() => setOpenPopup(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(180deg, #42A0F0 0%, #FFF3B0 100%)",
          color: "white",
          borderRadius: "16px",
          padding: "14px 18px",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          // cursor: "pointer",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "70px",
          }}
        >
          <img
            src={iconUrl}
            alt="Weather Condition"
            style={{ width: "60px", height: "60px" }}
          />
          <Typography
            sx={{
              fontSize: "15px",
              fontWeight: 500,
              marginTop: "2px",
              color: "rgba(73, 74, 75, 1)",
            }}
          >
            {short_desc}
          </Typography>
        </Box>

        <Divider
          orientation="vertical"
          flexItem
          sx={{
            height: "65px",
            width: "1px",
            backgroundColor: "#fff",
            margin: "20px",
          }}
        />

        <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Typography
            sx={{
              fontSize: "19px",
              fontWeight: 500,
              marginBottom: "2px",
              color: "rgba(73, 74, 75, 1)",
            }}
          >
            {locationName}
          </Typography>
          <Typography
            sx={{
              fontSize: "34px",
              fontWeight: "bold",
              lineHeight: "1",
              margin: "0.5rem",
              color: "rgba(73, 74, 75, 1)",
            }}
          >
            {wholeTemperature}°C
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "14px", color: "rgba(73, 74, 75, 1)" }}
          >
            {long_desc}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          border: "1px solid #f7e6c4",
          borderRadius: "12px",
          padding: "12px",
          mt: 3,
        }}
      >
        <Grid container spacing={2} justifyContent="space-around">
          <Grid item xs={5}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                src={humidityIcon}
                alt="Humidity Icon"
                style={{
                  width: "28px",
                  height: "28px",
                  marginRight: "8px",
                  marginBottom: "1rem",
                }}
              />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t("currentWeather.humidity", "Humidity")}
                </Typography>
                <Typography variant="h6" fontWeight="500" fontSize={"20px"}>
                  {humidity}%
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={5}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                src={windIcon}
                alt="Wind Icon"
                style={{
                  width: "28px",
                  height: "28px",
                  marginRight: "8px",
                  marginBottom: "1.5rem",
                }}
              />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t("currentWeather.wind", "Wind")}
                </Typography>
                <Typography variant="h6" fontWeight="500" fontSize={"20px"}>
                  {wholeWindSpeed} km/h
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <CurrentWeatherPopup
        open={openPopup}
        onClose={() => setOpenPopup(false)}
        currentForecast={widgetData}
        allForecastData={allForecastData}
      />
    </>
  );
};

export default CurrentWeather;
