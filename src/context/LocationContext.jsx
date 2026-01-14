import React, { createContext, useState } from "react";

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  // Initialize state with data from sessionStorage if available
  const [location, setLocation] = useState(() => {
    const storedLocation = sessionStorage.getItem("location");
    return storedLocation
      ? JSON.parse(storedLocation)
      : { selectedState: "Maharashtra", selectedDistrict: "Pune" };
  });

  // Update both the state and sessionStorage
  const updateLocation = (state, district) => {
    const newLocation = { selectedState: state, selectedDistrict: district };
    setLocation(newLocation);
    sessionStorage.setItem("location", JSON.stringify(newLocation));
  };

  return (
    <LocationContext.Provider value={{ location, updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
