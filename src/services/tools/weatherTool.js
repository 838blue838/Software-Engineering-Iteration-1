// Detects weather questions and fetches data from Open-Meteo
// Examples: "what's the weather in Paris", "weather in NYC", "is it raining in London"

function detectWeather(content) {
  const weatherPattern = /\b(weather|temperature|raining|sunny|cloudy|forecast|hot|cold)\b/i;
  if (!weatherPattern.test(content)) return null;

  // Try to extract location after "in", "at", or "for"
  const locationMatch = content.match(/\b(?:in|at|for)\s+([A-Za-z\s,]+?)(?:\?|$|\.|\s+today|\s+tomorrow|\s+now)/i);
  if (locationMatch) {
    return locationMatch[1].trim();
  }

  return null;
}

async function geocode(location) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("Location not found");
  }
  return {
    name: data.results[0].name,
    country: data.results[0].country,
    lat: data.results[0].latitude,
    lon: data.results[0].longitude
  };
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  return await res.json();
}

function describeWeatherCode(code) {
  const codes = {
    0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Light rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Light snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Light rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm with hail"
  };
  return codes[code] || "Unknown conditions";
}

async function getWeather(content) {
  const location = detectWeather(content);
  if (!location) return null;

  try {
    const place = await geocode(location);
    const weather = await fetchWeather(place.lat, place.lon);
    const current = weather.current;

    return {
      location: `${place.name}, ${place.country}`,
      temperature: `${Math.round(current.temperature_2m)}°F`,
      conditions: describeWeatherCode(current.weather_code),
      humidity: `${current.relative_humidity_2m}%`,
      wind: `${Math.round(current.wind_speed_10m)} mph`,
      formatted: `Current weather in ${place.name}, ${place.country}: ${describeWeatherCode(current.weather_code)}, ${Math.round(current.temperature_2m)}°F, humidity ${current.relative_humidity_2m}%, wind ${Math.round(current.wind_speed_10m)} mph.`
    };
  } catch (err) {
    return { error: `Could not get weather: ${err.message}` };
  }
}

module.exports = { detectWeather, getWeather };