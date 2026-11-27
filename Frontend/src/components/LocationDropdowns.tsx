import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { UISelect } from './ui/Select';

interface LocationDropdownsProps {
  value: string;
  onChange: (loc: string) => void;
  required?: boolean;
}

const INDIAN_STATES_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Tirupati', 'Guntur', 'Kakinada', 'Nellore', 'Anantapur'],
  'Assam & North East': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Agartala', 'Imphal'],
  'Bihar': ['Patna', 'Muzaffarpur', 'Bhagalpur', 'Gaya', 'Darbhanga', 'Begusarai'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  'Delhi NCR': ['New Delhi', 'Noida', 'Gurugram', 'Faridabad', 'Ghaziabad'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bharuch / Dahej', 'Jamnagar'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Sonipat', 'Ambala', 'Hisar'],
  'Himachal Pradesh': ['Baddi', 'Shimla', 'Solan', 'Paonta Sahib', 'Kangra'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Palakkad', 'Thrissur'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Pithampur'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Chhatrapati Sambhajinagar (Aurangabad)', 'Thane'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Paradip', 'Jharsuguda'],
  'Punjab': ['Ludhiana', 'Chandigarh / Mohali', 'Amritsar', 'Jalandhar', 'Bathinda', 'Patiala'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bhiwadi / Alwar', 'Ajmer'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruppur', 'Hosur', 'Tiruchirappalli'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Medak / Sangareddy'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida / Greater Noida', 'Agra', 'Varanasi', 'Gorakhpur'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rudrapur / Pantnagar', 'Haldwani'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Haldia', 'Siliguri'],
  'Other State / Union Territory': ['Chandigarh', 'Puducherry', 'Jammu', 'Srinagar', 'Other City'],
};

export const LocationDropdowns: React.FC<LocationDropdownsProps> = ({ value, onChange, required }) => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    if (value && value.includes(',')) {
      const parts = value.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        setSelectedCity(parts[0]);
        setSelectedState(parts[1]);
      }
    } else if (value) {
      setSelectedState(value);
    }
  }, [value]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    const cities = INDIAN_STATES_CITIES[state] || [];
    const firstCity = cities[0] || state;
    setSelectedCity(firstCity);
    onChange(`${firstCity}, ${state}`);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    onChange(`${city}, ${selectedState}`);
  };

  return (
    <div className="space-y-1.5 font-inter">
      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-blue-600" />
        <span>Proposed Project Location (State &amp; City) {required && '*'}</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UISelect
          value={selectedState}
          onValueChange={handleStateChange}
          placeholder="Select State"
          options={Object.keys(INDIAN_STATES_CITIES).map((state) => ({
            value: state,
            label: state,
          }))}
          triggerClassName="bg-white border-slate-300 text-xs"
        />

        <UISelect
          value={selectedCity}
          onValueChange={handleCityChange}
          placeholder="Select City"
          disabled={!selectedState}
          options={(INDIAN_STATES_CITIES[selectedState] || []).map((city) => ({
            value: city,
            label: city,
          }))}
          triggerClassName="bg-white border-slate-300 text-xs"
        />
      </div>
    </div>
  );
};
