import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  SwipeableDrawer,
  IconButton,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useTranslation } from "react-i18next";

// Helper to add "st", "nd", "rd", "th"
function getDaySuffix(day) {
  if (day % 100 >= 11 && day % 100 <= 13) {
    return "th";
  }
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

// Convert "HH:MM" (24-hour) to 12-hour format with AM/PM
function convertTo12HourFormat(timeStr) {
  const [hourStr, minuteStr] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour === 0) {
    hour = 12; // midnight is 12:XX AM
  } else if (hour > 12) {
    hour = hour - 12; // e.g. 13 -> 1 PM
  }
  return `${hour}:${minuteStr} ${ampm}`;
}

const unitMapping = {
  temperature: "°C",
  humidity: "%",
  wind: "m/s",
};

const NextWeekWeatherDetailPopup = ({
  open,
  onClose,
  forecast,
  allForecastData,
  initialDate,
}) => {
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState("temperature");
  const [selectedDate, setSelectedDate] = useState("");

  // Gather unique dates from allForecastData
  const dateList = useMemo(() => {
    if (!allForecastData) return [];
    const uniqueDates = new Set();
    allForecastData.forEach((item) => {
      const parts = item.descriptor?.name?.split(" ");
      // e.g. "Forecast for 2025-03-06 06:00:00" => parts[2] = "2025-03-06"
      if (parts?.length >= 4 && parts[2]) {
        uniqueDates.add(parts[2]);
      }
    });
    return [...uniqueDates].sort();
  }, [allForecastData]);

  // Set selected date when popup opens or initialDate changes
  useEffect(() => {
    if (initialDate && dateList.includes(initialDate)) {
      setSelectedDate(initialDate);
    } else if (dateList.length > 0) {
      setSelectedDate(dateList[0]);
    }
  }, [initialDate, dateList]);

  // Build chart data & daily summary for the selected date
  const { chartData, dailySummary } = useMemo(() => {
    if (!allForecastData || !selectedDate) {
      return { chartData: [], dailySummary: null };
    }

    // Filter forecasts for the selected day
    const dailyForecasts = allForecastData.filter((item) => {
      const parts = item.descriptor?.name?.split(" ");
      return parts?.[2] === selectedDate;
    });

    // Build chart data
    const dataForChart = dailyForecasts.map((item) => {
      const parts = item.descriptor.name.split(" ");
      // parts[3] might be "06:00:00"
      const timeStr = parts[3] || "";
      // Convert "06:00" to "6:00 AM"
      const hourMinute = timeStr.slice(0, 5); // "06:00"
      const time12 = convertTo12HourFormat(hourMinute);

      // Retrieve tags for temperature/humidity/wind
      const tempTag = item.tags?.[0]?.list?.find(
        (t) => t.descriptor.code === "Temperature"
      );
      const humTag = item.tags?.[0]?.list?.find(
        (t) => t.descriptor.code === "Humidity"
      );
      const windTag = item.tags?.[0]?.list?.find(
        (t) => t.descriptor.code === "Wind-Speed"
      );      

      const temperatureValue = tempTag ? parseFloat(tempTag.value) : null;
      const humidityValue = humTag ? parseFloat(humTag.value) : null;
      const windValue = windTag ? parseFloat(windTag.value) : null;

      return {
        time: time12, // store 12-hour format
        temperature: temperatureValue,
        humidity: humidityValue,
        wind: windValue,
      };
    });

    // Sort by time ascending
    dataForChart.sort((a, b) => {
      // Convert e.g. "6:00 AM" -> numeric hour
      const parseHour = (timeString) => {
        const [hourMin, ampm] = timeString.split(" ");
        const [hrStr] = hourMin.split(":");
        let hr = parseInt(hrStr, 10);
        if (ampm === "PM" && hr < 12) hr += 12;
        if (ampm === "AM" && hr === 12) hr = 0;
        return hr;
      };
      const aHour = parseHour(a.time);
      const bHour = parseHour(b.time);
      return aHour - bHour;
    });

    if (dataForChart.length === 0) {
      return { chartData: [], dailySummary: null };
    }

    // Compute daily min/max for temperature/humidity/wind
    let minTemp = Infinity,
      maxTemp = -Infinity,
      minHum = Infinity,
      maxHum = -Infinity,
      maxWind = -Infinity;

    dataForChart.forEach((d) => {
      if (d.temperature !== null) {
        if (d.temperature < minTemp) minTemp = d.temperature;
        if (d.temperature > maxTemp) maxTemp = d.temperature;
      }
      if (d.humidity !== null) {
        if (d.humidity < minHum) minHum = d.humidity;
        if (d.humidity > maxHum) maxHum = d.humidity;
      }
      if (d.wind !== null) {
        if (d.wind > maxWind) maxWind = d.wind;
      }
    });

    // Format the date for daily summary
    const dateObj = new Date(selectedDate);
    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    const monthName = dateObj.toLocaleDateString("en-US", { month: "long" });
    const day = dateObj.getDate();
    const suffix = getDaySuffix(day);
    const year = dateObj.getFullYear();
    const readableDate = `${weekday}, ${day}${suffix} ${monthName} ${year}`;

    const summary = {
      readableDate,
      minTemp: minTemp.toFixed(0), // whole number
      maxTemp: maxTemp.toFixed(0), // whole number
      minHum: Math.round(minHum), // rounded
      maxHum: Math.round(maxHum), // rounded
      maxWind: maxWind.toFixed(0), // whole number
    };

    return { chartData: dataForChart, dailySummary: summary };
  }, [allForecastData, selectedDate]);

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiPaper-root": {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
      }}
    >
      <Box
        p={2}
        sx={{
          minHeight: "60vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        {/* Close Button */}
        <Box display="flex" justifyContent="flex-end">
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Calendar / Date Row */}
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", mb: 2 }}>
          {dateList.map((dateStr) => {
            const dateObj = new Date(dateStr);
            const dayName = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const monthDay = dateObj.toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
            });
            const isActive = dateStr === selectedDate;
            return (
              <Box
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                sx={{
                  cursor: "pointer",
                  minWidth: 70,
                  textAlign: "center",
                  borderRadius: 2,
                  p: 1,
                  backgroundColor: isActive ? "rgb(178, 210, 53)" : "#f5f5f5",
                  color: isActive ? "rgb(0, 0, 0)" : "#333",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {dayName}
                </Typography>
                <Typography variant="body2">{monthDay}</Typography>
              </Box>
            );
          })}
        </Box>

        {/* Metric Selector */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, mt: 2 }}
        >
          <Select
            size="small"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            <MenuItem value="temperature">
              {t("weatherDetail.temperature", "Temperature")}
            </MenuItem>
            <MenuItem value="humidity">
              {t("weatherDetail.humidity", "Humidity")}
            </MenuItem>
            <MenuItem value="wind">
              {t("weatherDetail.windSpeed", "Wind Speed")}
            </MenuItem>
          </Select>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Chart Section */}
        <Box sx={{ flex: 1, mb: 2 }}>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis
                  tickFormatter={(value) =>
                    `${value} ${unitMapping[selectedMetric]}`
                  }
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${value} ${unitMapping[selectedMetric]}`,
                    name,
                  ]}
                />
                {/* Changed stroke color to black (#000000) */}
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#000000"
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Typography variant="body2" color="textSecondary">
              {t("weatherDetail.noData", "No data available for this date.")}
            </Typography>
          )}
        </Box>

        {/* Daily Summary */}
        {dailySummary && (
          <Box
            sx={{
              background: "#f2f8de",
              p: 3,
              borderRadius: 5,
            }}
          >
            <Typography variant="body1">
              <Typography sx={{ mb: 1, fontWeight: 600 }}>
                {t("weatherDetail.forecastFor", "Forecast for")}{" "}
                {dailySummary.readableDate}
              </Typography>
              <Typography variant="body2">
                <strong>
                  {t("weatherDetail.temperature", "Temperature:")}
                </strong>{" "}
                {dailySummary.minTemp}°C – {dailySummary.maxTemp}°C.
              </Typography>
              <Typography variant="body2">
                <strong>{t("weatherDetail.humidity", "Humidity:")}</strong>{" "}
                {dailySummary.minHum}% – {dailySummary.maxHum}%.
              </Typography>
              <Typography variant="body2">
                <strong>{t("weatherDetail.windSpeed", "Wind Speed:")}</strong>{" "}
                {t("weatherDetail.upTo", "Up to")} {dailySummary.maxWind}{" "}
                {unitMapping.wind}.
              </Typography>
            </Typography>
          </Box>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default NextWeekWeatherDetailPopup;
