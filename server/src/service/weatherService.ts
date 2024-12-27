import dotenv from "dotenv";
dotenv.config();

// TODO: Define an interface for the Coordinates object
interface Coordinates {
  latitude: number;
  longitude: number;
  country?: string;
  state?: string;
}

// TODO: Define a class for the Weather object
class Weather {
  city: string;
  date: string;
  tempF: number;
  windSpeed: number;
  humidity: number;
  icon: string;
  iconDescription: string;

  constructor(
    city: string,
    date: string,
    tempF: number,
    windSpeed: number,
    humidity: number,
    icon: string,
    iconDescription: string
  ) {
    this.city = city;
    this.date = date;
    this.tempF = tempF;
    this.windSpeed = windSpeed;
    this.humidity = humidity;
    this.icon = icon;
    this.iconDescription = iconDescription;
  }
}

// TODO: Complete the WeatherService class
class WeatherService {
  // TODO: Define the baseURL, API key, and city name properties
  private baseURL: string;
  private apiKey: string;
  private cityName: string;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || "";
    this.apiKey = process.env.API_KEY || "";
    this.cityName = "";
  }

  // TODO: Create fetchLocationData method.
  private async fetchLocationData(query: string): Promise<Coordinates> {
    const response = await fetch(this.buildGeocodeQuery(query));
    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error(`No Location Data found in Query: ${query}`);
    }

    return this.destructureLocationData(data);
  }

  // TODO: Create destructureLocationData method
  private destructureLocationData(locationData: any[]): Coordinates {
    if (!locationData[0] || typeof locationData[0].lat !== "number" || typeof locationData[0].lon !== "number") {
      throw new Error("Invalid location data format");
    }

    const { lat, lon, country, state } = locationData[0];
    const coordinates: Coordinates = {
      latitude: lat,
      longitude: lon,
      country,
      state,
    };
    return coordinates;
  }

  // TODO: Create buildGeocodeQuery method
  private buildGeocodeQuery(query: string): string {
    // Ensure query is properly formated to handle spaces and special characters
    const encodedQuery = encodeURIComponent(query);
    return `${this.baseURL}/geo/1.0/direct?q=${encodedQuery}&limit=5&appid=${this.apiKey}`;
  }

  // TODO: Create buildWeatherQuery method
  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseURL}/data/2.5/forecast?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${this.apiKey}`;
  }

  // TODO: Create fetchAndDestructureLocationData method
  private async fetchAndDestructureLocationData(): Promise<Coordinates> {
    return this.fetchLocationData(this.cityName);
  }

  // TODO: Create fetchWeatherData method
  private async fetchWeatherData(coordinates: Coordinates): Promise<any> { 
    const response = await fetch(this.buildWeatherQuery(coordinates));
    const weatherData = await response.json(); 
    

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }
    return weatherData;
  }

  // TODO: Build parseCurrentWeather method
  private parseCurrentWeather(response: any): Weather {
    if (!response.city || !response.list || response.list.length === 0) {
      throw new Error("Invalid Weather Data Format");
    }

    const city = response.city.name;
    const currentWeatherData = response.list[0];

    // Formatting the date to show as mm/dd/yyyy
    const date = new Date(currentWeatherData.dt_txt);
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;

    // Convert temperature from Kelvin to Fahrenheit
    const tempInKelvin = currentWeatherData.main.temp;
    const tempF = Math.round((tempInKelvin - 273.15) * (9 / 5) + 32);

    return new Weather(
      city,
      formattedDate,
      tempF, // Converted Temperature
      currentWeatherData.wind.speed,
      currentWeatherData.main.humidity,
      currentWeatherData.weather[0].icon,
      currentWeatherData.weather[0].description
    );
  }

  // TODO: Complete buildForecastArray method: This method is used to display weather
  // forcast for mulitple days
  private buildForecastArray(currentWeather: Weather, weatherData: any[]): Weather[] {

    if (!weatherData[0] || !weatherData[0].dt_txt) {
      throw new Error("Invalid weather data format"); 
    }

    const city = currentWeather.city;
    const dailyForecastMap: Map<string, Weather> = new Map();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to only compare the date
    const todayFormattedDate = `${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getDate().toString().padStart(2, "0")}/${today.getFullYear()}`;
    
    dailyForecastMap.set(todayFormattedDate, currentWeather);

    weatherData.forEach((data) => {
      const date = new Date(data.dt_txt);
      // Ensure weather forecast information is purtaining to Today's date and future date. NOT the past
      if (date >= today) {
        const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;

        // Convert temperature from Kelvin to Fahrenheit
        const tempInKelvin = data.main.temp;
        const tempF = Math.round((tempInKelvin - 273.15) * (9 / 5) + 32);

        const weather = new Weather(
          city,
          formattedDate, // Date Format as mm/dd/yyyy
          tempF, // Converted Temperature
          data.wind.speed,
          data.main.humidity,
          data.weather[0].icon,
          data.weather[0].description
        );

        const currentEntry = dailyForecastMap.get(formattedDate);
        if (!currentEntry || Math.abs(date.getHours() - 12) < Math.abs(new Date(currentEntry.date).getHours() - 12)) {
          dailyForecastMap.set(formattedDate, weather);
        }
      }
    });

    // Sort the array to ensure today's date is first
    let sortForecastArray = Array.from(dailyForecastMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if(!sortForecastArray.some(weather => weather.date === todayFormattedDate)) {
      sortForecastArray.unshift(currentWeather);
    }

    const dailyForecastArray = sortForecastArray.slice(0, 6);

    return dailyForecastArray;
  }

  // TODO: Complete getWeatherForCity method
  async getWeatherForCity(city: string): Promise<Weather[]> {
    try {
      this.cityName = city;
      const coordinates = await this.fetchAndDestructureLocationData();

      const weatherData = await this.fetchWeatherData(coordinates);

      if (!weatherData || !weatherData.list) {
        throw new Error("Invalid weather data received.");
      }

      const currentWeather = this.parseCurrentWeather(weatherData);
      const forecastArray = this.buildForecastArray(currentWeather, weatherData.list);

      return forecastArray;
    } catch (err) {
      console.error("Error fetching weather:", err);
      throw new Error(`Failed to fetch weather for city: ${city}`);
    }
  }
}

export default new WeatherService();
