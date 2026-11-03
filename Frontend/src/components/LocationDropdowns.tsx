import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface LocationDropdownsProps {
  value: string;
  onChange: (loc: string) => void;
  required?: boolean;
}

const INDIAN_STATES_DISTRICTS: Record<string, string[]> = {
  'Maharashtra': ['Mumbai Industrial Zone', 'Pune - Chakan Auto Cluster', 'Nagpur MIHAN SEZ', 'Aurangabad DMIC', 'Nashik Industrial Area'],
  'Gujarat': ['Ahmedabad - Sanand Industrial Hub', 'Surat Diamond & Textile Hub', 'Vadodara Petrochem Hub', 'Dahej PCPIR SEZ', 'Rajkot Engineering Cluster'],
  'Telangana': ['Hyderabad Pharma City', 'Warangal Textile Park', 'Genome Valley Biotech Hub', 'Zaheerabad NIMZ', 'Medak Heavy Machinery Zone'],
  'Andhra Pradesh': ['Visakhapatnam Industrial Corridor', 'Sri City Multi-Product SEZ', 'Kakinada Petro Zone', 'Ananthapur Auto Cluster', 'Tirupati EMC Hub'],
  'Tamil Nadu': ['Chennai Auto & Electronics Corridor', 'Coimbatore Engineering Hub', 'Hosur Auto Cluster', 'Tirupur Textile Hub', 'Madurai Industrial Corridor'],
  'Karnataka': ['Bengaluru Aerospace & Tech Hub', 'Peenya Industrial Area', 'Dharwad Auto Cluster', 'Belagavi Foundry Cluster', 'Mysuru Industrial Estate'],
  'Haryana': ['Gurugram - Manesar IMT', 'Faridabad Industrial Hub', 'Panipat Textile Cluster', 'Bhiwani Textile Zone', 'Sonipat Food Park'],
  'Punjab': ['Ludhiana Hosiery & Auto Hub', 'Amritsar Industrial Zone', 'Jalandhar Sports & Leather Cluster', 'Bathinda Agro Hub', 'Mohali IT Hub'],
  'Uttar Pradesh': ['Noida - Greater Noida Tech Zone', 'Kanpur Leather & Chemical Hub', 'Agra Industrial Zone', 'Varanasi Logistics Hub', 'Gorakhpur Industrial Hub'],
  'Rajasthan': ['Bhiwadi - Neemrana Industrial Area', 'Jaipur Sitapura Industrial Area', 'Alwar DMIC Hub', 'Jodhpur Solar & Handicraft Zone', 'Kota Industrial Hub']
};

export const LocationDropdowns: React.FC<LocationDropdownsProps> = ({ value, onChange, required }) => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  useEffect(() => {
    if (value && value.includes(',')) {
      const parts = value.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        setSelectedDistrict(parts[0]);
        setSelectedState(parts[1]);
      }
    } else if (value) {
      setSelectedState(value);
    }
  }, [value]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    const districts = INDIAN_STATES_DISTRICTS[state] || [];
    const firstDistrict = districts[0] || state;
    setSelectedDistrict(firstDistrict);
    onChange(`${firstDistrict}, ${state}`);
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    onChange(`${district}, ${selectedState}`);
  };

  return (
    <div className="space-y-1.5 font-inter">
      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-blue-600" />
        <span>Proposed Project Location &amp; Industrial Cluster {required && '*'}</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={selectedState}
          required={required}
          onChange={(e) => handleStateChange(e.target.value)}
          className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
        >
          <option value="">Select State</option>
          {Object.keys(INDIAN_STATES_DISTRICTS).map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        <select
          value={selectedDistrict}
          required={required}
          disabled={!selectedState}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer disabled:opacity-50"
        >
          <option value="">Select Industrial Hub / Cluster</option>
          {(INDIAN_STATES_DISTRICTS[selectedState] || []).map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
