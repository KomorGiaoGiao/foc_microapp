// Correct ambiguous city geocodes using the office's documented headquarters.
const locationCorrections = [
  {
    officeName: "Alea Global Group",
    city: "Bayan",
    country: "Kuwait",
    countryCode: "KW",
    lat: 29.3032,
    lng: 48.0488,
  },
  {
    officeName: "Aayan Leasing & Investments",
    city: "Safat",
    country: "Kuwait",
    countryCode: "KW",
    lat: 29.3697,
    lng: 47.9783,
  },
  {
    officeName: "Grok Ventures",
    city: "Surry Hills",
    country: "Australia",
    countryCode: "AU",
    lat: -33.8842,
    lng: 151.2117,
  },
  {
    officeName: "Hancock Prospecting Group",
    city: "West Perth",
    country: "Australia",
    countryCode: "AU",
    lat: -31.948,
    lng: 115.8417,
  },
  {
    officeName: "Moreland Management Company",
    city: "Orange Village",
    country: "United States",
    countryCode: "US",
    lat: 41.4284,
    lng: -81.469,
  },
  {
    officeName: "Barksdale Management Corporation",
    city: "Ridgeland",
    country: "United States",
    countryCode: "US",
    lat: 32.4285,
    lng: -90.1323,
  },
  {
    officeName: "Harbourton Enterprises",
    city: "Princeton",
    country: "United States",
    countryCode: "US",
    lat: 40.3573,
    lng: -74.6672,
  },
];

for (const location of window.FAMILY_OFFICE_LOCATIONS) {
  if (location.countryCode === "TW") {
    location.country = "China";
    location.countryCode = "CN";
  }
}

const mapFeatures = window.COUNTRIES_GEOJSON.features;
const chinaFeature = mapFeatures.find((feature) => feature.properties.ISO_A2_EH === "CN");
const taiwanFeatureIndex = mapFeatures.findIndex((feature) => feature.properties.ISO_A2_EH === "TW");
if (chinaFeature && taiwanFeatureIndex !== -1) {
  const [taiwanFeature] = mapFeatures.splice(taiwanFeatureIndex, 1);
  const chinaPolygons = chinaFeature.geometry.type === "Polygon"
    ? [chinaFeature.geometry.coordinates]
    : chinaFeature.geometry.coordinates;
  const taiwanPolygons = taiwanFeature.geometry.type === "Polygon"
    ? [taiwanFeature.geometry.coordinates]
    : taiwanFeature.geometry.coordinates;
  chinaFeature.geometry = {
    type: "MultiPolygon",
    coordinates: [...chinaPolygons, ...taiwanPolygons],
  };
}

for (const correction of locationCorrections) {
  const location = window.FAMILY_OFFICE_LOCATIONS.find((entry) =>
    entry.institutionNames.includes(correction.officeName),
  );
  if (!location) continue;

  Object.assign(location, {
    city: correction.city,
    country: correction.country,
    countryCode: correction.countryCode,
    lat: correction.lat,
    lng: correction.lng,
  });
}
