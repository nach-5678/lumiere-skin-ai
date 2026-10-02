
import { WeatherData } from '../types';

export const getEnvironmentalData = async (lat: number, lng: number): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,is_day,weather_code&daily=uv_index_max&timezone=auto&forecast_days=1`
    );
    const data = await response.json();

    const current = data.current;
    const daily = data.daily;
    const uvIndex = daily.uv_index_max[0];
    const humidity = current.relative_humidity_2m;
    const temp = current.temperature_2m;
    const isDay = current.is_day === 1;

    let uvAdvice = "Basic SPF 30+ recommended.";
    if (uvIndex > 8) {
        uvAdvice = "Extreme UV! Use SPF 50+ PA++++, seek shade, and reapply every 2 hours.";
    } else if (uvIndex > 6) {
        uvAdvice = "High UV. Use SPF 50+ PA+++ and reapply every 2 hours.";
    } else if (uvIndex > 3) {
        uvAdvice = "Moderate UV. Use SPF 30+ PA++ for daily protection.";
    } else if (uvIndex > 0) {
        uvAdvice = "Low UV. Use SPF 15+ or SPF 30+ for basic protection.";
    } else {
        uvAdvice = "No UV risk. Nighttime routine recommended.";
    }

    let envAdvice = "";
    if (humidity < 30) {
        envAdvice = " Air is very dry. Layer hydrating serums under a rich moisturizer.";
    } else if (humidity > 70) {
        envAdvice = " High humidity. Stick to lightweight, non-comedogenic gel moisturizers.";
    } else if (temp < 5) {
        envAdvice = " Cold weather can strip barriers. Protect skin with a rich ceramide cream.";
    }

    const advice = uvAdvice + envAdvice;

    return {
        uvIndex,
        humidity,
        temperature: temp,
        isDay,
        advice
    };
  } catch (error) {
    console.error("Weather fetch error", error);
    throw new Error("Could not fetch environmental data");
  }
};
