import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { UISelect } from './ui/Select';

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
  'Rajasthan': ['Bhiwadi - Neemrana Industrial Area', 'Jaipur Sitapura Industrial Area', 'Alwar DMIC Hub', 'Jodhpur Solar & Handicraft Zone', 'Kota Industrial Hub'],
  'Madhya Pradesh': ['Pithampur Auto & Manufacturing Hub', 'Mandideep Industrial Area', 'Malanpur SEZ', 'Dewas Chemical & Engineering Cluster', 'Indore Super Corridor'],
  'West Bengal': ['Kolkata Leather & IT Park', 'Haldia Petrochemical SEZ', 'Asansol - Durgapur Steel Cluster', 'Kharagpur Vidyasagar Industrial Park', 'Siliguri Logistics Hub'],
  'Odisha': ['Kalinganagar Metal & Steel Hub', 'Paradip Petroleum & Petrochem SEZ', 'Jharsuguda Aluminium Cluster', 'Bhubaneswar Info Valley SEZ', 'Rourkela Steel Corridor'],
  'Kerala': ['Kochi Petrochem & Port SEZ', 'KINFRA Mega Food Park (Palakkad)', 'Kakkanad Infopark & Electronics SEZ', 'Thiruvananthapuram Technopark'],
  'Bihar': ['Patna Mega Logistics Park', 'Barauni Industrial Cluster', 'Bhagalpur Textile & Silk Park', 'Muzaffarpur Food & Leather Cluster'],
  'Chhattisgarh': ['Raipur - Durg Industrial Corridor', 'Bilaspur Engineering Zone', 'Korba Power & Metal Cluster', 'Bhilai Steel Industrial Area'],
  'Jharkhand': ['Jamshedpur Auto & Metallurgy Hub', 'Bokaro Steel & Chemical Zone', 'Ranchi Heavy Engineering Cluster', 'Dhanbad Mineral Hub'],
  'Uttarakhand': ['SIDCUL Haridwar Industrial Area', 'Pantnagar Auto & Engineering Hub', 'Dehradun IT & Pharma Park', 'Sitarganj Phase II Industrial Estate'],
  'Himachal Pradesh': ['Baddi - Barotiwala - Nalagarh Pharma Hub', 'Paonta Sahib Industrial Area', 'Kala Amb Multi-Product Cluster', 'Tahliwal Industrial Area'],
  'Assam & North East': ['Guwahati Brahmaputra Industrial Corridor', 'Tinsukia Agro & Tea Hub', 'Silchar Logistics Hub', 'Dimapur - Kohima Trade Corridor'],
  'Delhi NCR': ['Okhla Industrial Area', 'Mayapuri Industrial Area', 'Narela Food & Processing Hub', 'Patparganj Industrial Area'],
  'Goa': ['Verna Industrial Estate', 'Kundaim Industrial Area', 'Pilerne Industrial Estate', 'Madkaim Industrial Estate'],
  'Other State / Union Territory': ['Greenfield Industrial Hub', 'Special Economic Zone (SEZ)', 'Export Oriented Unit (EOU) Zone', 'Mega Food Park / Agro Cluster']
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
        <UISelect
          value={selectedState}
          onValueChange={handleStateChange}
          placeholder="Select State"
          options={Object.keys(INDIAN_STATES_DISTRICTS).map((state) => ({
            value: state,
            label: state
          }))}
          triggerClassName="bg-white border-slate-300 text-xs"
        />

        <UISelect
          value={selectedDistrict}
          onValueChange={handleDistrictChange}
          placeholder="Select Industrial Hub / Cluster"
          disabled={!selectedState}
          options={(INDIAN_STATES_DISTRICTS[selectedState] || []).map((district) => ({
            value: district,
            label: district
          }))}
          triggerClassName="bg-white border-slate-300 text-xs"
        />
      </div>
    </div>
  );
};
