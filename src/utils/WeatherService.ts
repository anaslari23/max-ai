
type WeatherData = {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: string;
};

class WeatherService {
  private apiKey: string = "";
  private baseUrl: string = "https://api.openweathermap.org/data/2.5";
  
  constructor() {
    // In a real app, you would use environment variables or secure storage for the API key
    // For now, we'll simulate weather responses without a real API key
  }
  
  public async getWeather(location: string): Promise<WeatherData> {
    try {
      // In a production app, you would make a real API call like this:
      // const response = await fetch(`${this.baseUrl}/weather?q=${location}&units=metric&appid=${this.apiKey}`);
      // const data = await response.json();
      
      // For demo purposes, simulate a response
      console.log(`Simulated weather lookup for ${location}`);
      
      // Generate random but plausible weather data
      const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Thunderstorms", "Snowy", "Foggy", "Clear"];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      const randomTemp = Math.floor(Math.random() * 30) + 5; // 5 to 35 degrees Celsius
      const randomHumidity = Math.floor(Math.random() * 60) + 30; // 30% to 90%
      const randomWind = Math.floor(Math.random() * 20) + 2; // 2 to 22 km/h
      
      const forecasts = [
        "Expect similar conditions tomorrow.",
        "Weather will improve over the next few days.",
        "A cold front is expected later this week.",
        "Conditions should remain stable for the next few days.",
        "Chance of precipitation increasing tomorrow."
      ];
      const randomForecast = forecasts[Math.floor(Math.random() * forecasts.length)];
      
      return {
        location: location,
        temperature: randomTemp,
        condition: randomCondition,
        humidity: randomHumidity,
        windSpeed: randomWind,
        forecast: randomForecast
      };
    } catch (error) {
      console.error("Error fetching weather data:", error);
      throw new Error("Unable to retrieve weather information. Please try again later.");
    }
  }
  
  public generateWeatherResponse(weatherData: WeatherData): string {
    return `The current weather in ${weatherData.location} is ${weatherData.condition.toLowerCase()} with a temperature of ${weatherData.temperature}°C. The humidity is ${weatherData.humidity}% and wind speed is ${weatherData.windSpeed} km/h. ${weatherData.forecast}`;
  }
}

export default new WeatherService();
