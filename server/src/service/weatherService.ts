import dotenv from 'dotenv';
dotenv.config();

// TODO: Define an interface for the Coordinates object
interface Coordinates{
  latitude: number;
  longitude: number;
  country?: string;
  state?: string;
}

// TODO: Define a class for the Weather object
class Weather{
  city: string;
  date: string;
  temperature: number;
  windSpeed: number;
  humidity: number;
  icon: string;

  constructor(city: string, date: string, temperature: number, windSpeed: number, humidity: number, icon: string){
    this.city = city;
    this.date = date;
    this.temperature = temperature;
    this.windSpeed = windSpeed;
    this.humidity = humidity;
    this.icon = icon;
  }
}

// TODO: Complete the WeatherService class
class WeatherService {
  // TODO: Define the baseURL, API key, and city name properties
  private baseURL: string;
  private apiKey: string;
  private cityName: string;

  constructor(){
    this.baseURL = process.env.API_BASE_URL || '';
    this.apiKey = process.env.API_KEY || '';
    this.cityName = '';
  }


  // TODO: Create fetchLocationData method
  private async fetchLocationData(query: string) {
    const response = await fetch(this.buildGeocodeQuery(query));
    console.log('Geocode Quary:', this.buildGeocodeQuery(query));   //Log the geocode query
    const data = await response.json();
    console.log('API Response: ', data);                 //Debugging purposes
   
    if (!data || data.length === 0) {
      throw new Error(`No Location Data found in Query: ${query}`);
    }

    return this.destructureLocationData(data);
  }

  // TODO: Create destructureLocationData method
  private destructureLocationData(locationData: any[]): Coordinates {
    if (!locationData[0] || typeof locationData[0].lat !== 'number' || typeof locationData[0].lon !== 'number') {
      console.error('Invalid location data:', locationData);     //Debuggin purposes
      throw new Error('Invalid location data format');
    }

    const {lat, lon, country, state} = locationData[0];
    const coordinates: Coordinates = {
      latitude: lat, 
      longitude: lon, 
      country, 
      state
    };
    return coordinates;
  }
  

  // TODO: Create buildGeocodeQuery method
  private buildGeocodeQuery(query: string): string {
    return `${this.baseURL}/geo/1.0/direct?q=${query}&limit=1&appid=${this.apiKey}`;
  }

  // TODO: Create buildWeatherQuery method
  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseURL}/data/2.5/forecast?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${this.apiKey}`;
  }

  // TODO: Create fetchAndDestructureLocationData method
  private async fetchAndDestructureLocationData() {
    return this.fetchLocationData(this.cityName);  
  }

  // TODO: Create fetchWeatherData method
  private async fetchWeatherData(coordinates: Coordinates) {
    const response = await fetch(this.buildWeatherQuery(coordinates));

    if(!response.ok){
      throw new Error(`Failed to fetch weather data: ${response.statusText}`)
    }
    return response.json();

  }

  // TODO: Build parseCurrentWeather method
  private parseCurrentWeather(response: any) {
    if (!response.city || !response.list || response.list.length === 0) {
      throw new Error('Invalid Weather Data Format');
    }

    const city = response.city.name;
    const currentWeatherData = response.list[0];

    return new Weather(
      city,
      currentWeatherData.dt_txt,
      currentWeatherData.main.temp,
      currentWeatherData.wind.speed,
      currentWeatherData.main.humidity,
      currentWeatherData.weather[0].icon
      
    );
  }

  // TODO: Complete buildForecastArray method: This method is used to display weather 
  // forcast for mulitple days
  private buildForecastArray(currentWeather: Weather, weatherData: any){
    const city = weatherData.city.name;
    const forecastArray = weatherData.list.map((data: any) => new Weather(
      city,
      data.dt_txt,
      data.main.temp,
      data.wind.speed,
      data.main.humidity,
      data.weather[0].icon
    ));
    
    // Adding current weather at the beginning of the array
    forecastArray.unshift(currentWeather);
    return forecastArray;
  }
  
  // TODO: Complete getWeatherForCity method
  async getWeatherForCity(city: string): Promise<Weather[]> {
    try {
      this.cityName = city;
      const coordinates = await this.fetchAndDestructureLocationData();
      const weatherData = await this.fetchWeatherData(coordinates);
      const currentWeather = this.parseCurrentWeather(weatherData);
      const forecastArray = this.buildForecastArray(currentWeather, weatherData.list)
      
      return forecastArray;
      
    } catch (err) {
        console.error('Error fetching weather:', err);
        throw new Error(`Failed to fetch weather for city: ${city}`);
    }
    
  }
}

export default new WeatherService();
