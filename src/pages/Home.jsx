import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { LocationContext } from "../context/LocationContext";
import { LanguageContext } from "../context/LanguageContext";

const STATES_API = import.meta.env.VITE_STATES_API_URL;
const DISTRICTS_API = import.meta.env.VITE_DISTRICTS_API_URL;

const Home = () => {
  const { t } = useTranslation();
  const { language } = useContext(LanguageContext); // get language from context
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const navigate = useNavigate();
  const { updateLocation } = useContext(LocationContext);

  // Fetch states data and pass language preference as query parameter
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get(`${STATES_API}?lang=${language}`, {
          headers: { accept: "application/json" },
        });
        // Map the returned state objects to the format needed by Autocomplete
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
  }, [language]);

  // Fetch districts for a selected state and include language preference in the query
  const fetchDistricts = async (stateId) => {
    setLoadingDistricts(true);
    try {
      const response = await axios.get(`${DISTRICTS_API}/${stateId}?lang=${language}`, {
        headers: { accept: "application/json" },
      });
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
      updateLocation(selectedState.label, selectedDistrict.district_name);
      navigate("/weather");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t("home.selectLocation", "Please select your location")}
        </Typography>
        <Typography variant="h6" sx={{ textAlign: "left", fontSize: "14px" }}>
          {t("home.state", "State")} <span style={{ color: "red" }}>*</span>
        </Typography>
        <Autocomplete
          options={states}
          getOptionLabel={(option) => option.label}
          value={selectedState}
          onChange={(_, newValue) => {
            setSelectedState(newValue);
            setSelectedDistrict(null);
            if (newValue) {
              fetchDistricts(newValue.value);
            }
          }}
          loading={loadingStates}
          renderInput={(params) => (
            <TextField
              sx={{ mt: "7px" }}
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

        <Typography
          variant="h6"
          sx={{ textAlign: "left", fontSize: "14px", marginTop: "1rem" }}
        >
          {t("home.district", "District")} <span style={{ color: "red" }}>*</span>
        </Typography>
        <Autocomplete
          options={districts}
          getOptionLabel={(option) => option.district_name}
          value={selectedDistrict}
          onChange={(_, newValue) => setSelectedDistrict(newValue)}
          disabled={!selectedState || loadingDistricts}
          loading={loadingDistricts}
          renderInput={(params) => (
            <TextField
              sx={{ mt: "7px" }}
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

        <Button
          variant="contained"
          fullWidth
          sx={{
            mt: 2,
            backgroundColor: "#b2d235",
            color: "rgba(0, 0, 0, 1)",
            fontSize: "16px",
            borderRadius: "8px",
          }}
          onClick={handleSubmit}
          disabled={!selectedState || !selectedDistrict}
        >
          {t("home.submit", "Submit")}
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
