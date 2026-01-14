import React, { useState, useEffect, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Autocomplete,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LocationContext } from "../context/LocationContext";
import { LanguageContext } from "../context/LanguageContext";
const BASE_URL = "http://127.0.0.1:8000"
const STATES_API = BASE_URL +"/api/v1/states/";
const DISTRICTS_API = BASE_URL + "/api/v1/districts";

const LocationPopup = ({ open, onClose, onLocationSelect }) => {
  const { t } = useTranslation();
  const { language } = useContext(LanguageContext);
  const { updateLocation, location } = useContext(LocationContext);

  const navigate = useNavigate();

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    const storedState = sessionStorage.getItem("selectedState");
    const storedDistrict = sessionStorage.getItem("selectedDistrict");

    if (storedState) {
      const parsedState = JSON.parse(storedState);
      setSelectedState(parsedState);
      fetchDistricts(parsedState.value);
    }
    if (storedDistrict) {
      setSelectedDistrict(JSON.parse(storedDistrict));
    }
  }, []);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get(
          `${STATES_API}?lang=${language}&loc=${location || ""}`,
          { headers: { accept: "application/json" } }
        );
        const stateList = response.data.states.map((state) => ({
          value: state.state_id,
          label: state.state_name,
        }));
        setStates(stateList);
      } catch (error) {
        console.error("Error fetching states:", error);
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, [language, location]);

  const fetchDistricts = async (stateId) => {
    setLoadingDistricts(true);
    try {
      const response = await axios.get(
        `${DISTRICTS_API}/${stateId}?lang=${language}&loc=${location || ""}`,
        { headers: { accept: "application/json" } }
      );
      setDistricts(response.data.districts);
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleSubmit = () => {
    if (selectedState && selectedDistrict) {
      sessionStorage.setItem("selectedState", JSON.stringify(selectedState));
      sessionStorage.setItem("selectedDistrict", JSON.stringify(selectedDistrict));
      updateLocation(selectedState.label, selectedDistrict.district_name);
      if (onLocationSelect) {
        onLocationSelect(selectedDistrict);
      }
      onClose();
    }
  };

  const handleStateChange = (_, newValue) => {
    setSelectedState(newValue);
    setSelectedDistrict(null);
    if (newValue) {
      fetchDistricts(newValue.value);
    } else {
      setDistricts([]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        {t("locationPopup.title", "Select Your Location")}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box>
          <Typography variant="subtitle2">
            {t("locationPopup.state", "State")}{" "}
            <span style={{ color: "red" }}>*</span>
          </Typography>
          <Autocomplete
            options={states}
            getOptionLabel={(option) => option.label}
            value={selectedState}
            onChange={handleStateChange}
            loading={loadingStates}
            renderInput={(params) => (
              <TextField
                sx={{ marginTop: "0px !important" }}
                {...params}
                variant="outlined"
                size="small"
                margin="normal"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingStates ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">
            {t("locationPopup.district", "District")}{" "}
            <span style={{ color: "red" }}>*</span>
          </Typography>
          <Autocomplete
            sx={{ marginTop: "0px" }}
            options={districts}
            getOptionLabel={(option) => option.district_name}
            value={selectedDistrict}
            onChange={(_, newValue) => setSelectedDistrict(newValue)}
            disabled={!selectedState || loadingDistricts}
            loading={loadingDistricts}
            renderInput={(params) => (
              <TextField
                sx={{ marginTop: "0px !important" }}
                {...params}
                variant="outlined"
                size="small"
                margin="normal"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingDistricts ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedState || !selectedDistrict}
          sx={{
            backgroundColor: "#b2d235",
            color: "#000",
            textTransform: "none",
            marginTop: 2,
            boxShadow: "none",
          }}
        >
          {t("locationPopup.submit", "Submit")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPopup;
