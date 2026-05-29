import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import './RegionSelector.css';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Northern', 'Upper East', 'Upper West', 'Volta', 'Oti',
  'Bono', 'Bono East', 'Ahafo', 'Western North', 'Savannah', 'North East',
];

export default function RegionSelector({ value, onChange, label, required }) {
  // Parse existing value like "Accra, Greater Accra"
  const parts = (value || '').split(',').map(s => s.trim());
  const initialRegion = GHANA_REGIONS.includes(parts[0]) ? parts[0] : parts[1] || '';
  const initialCity = GHANA_REGIONS.includes(parts[0]) ? '' : parts[0] || '';
  const [region, setRegion] = useState(initialRegion);
  const [city, setCity] = useState(initialCity);

  const handleRegionChange = (r) => {
    setRegion(r);
    const combined = city ? `${city}, ${r}` : r;
    onChange(combined);
  };

  const handleCityChange = (c) => {
    setCity(c);
    const combined = c && region ? `${c}, ${region}` : c || region;
    onChange(combined);
  };

  return (
    <div className="region-selector">
      {label && <label className="region-label"><MapPin size={14} /> {label}</label>}
      <div className="region-fields">
        <div className="region-field">
          <label className="region-field-label">Region {required && <span className="req">*</span>}</label>
          <div className="region-select-wrap">
            <select
              value={region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="region-select"
              required={required}
            >
              <option value="">Select your region</option>
              {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <ChevronDown size={16} className="region-chevron" />
          </div>
        </div>
        {region && (
          <div className="region-field">
            <label className="region-field-label">City / Town {required && <span className="req">*</span>}</label>
            <input
              type="text"
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholder="e.g. Accra, Kumasi, Tamale"
              className="region-input"
              required={required}
            />
          </div>
        )}
      </div>
    </div>
  );
}
