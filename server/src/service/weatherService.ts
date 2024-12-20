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
  temperature: number;
  description: string;
  icon: string;

  constructor(temperature: number, description: string, icon: string){
    this.temperature = temperature;
    this.description = description;
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
    console.log(`Latitude: ${data[1].lat}`);
    console.log(`Longitude: ${data[1].lon}`);            //Debugging purposes


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
    return response.json();

  }

  // TODO: Build parseCurrentWeather method
  private parseCurrentWeather(response: any) {
    return new Weather(
      response.main.temp,
      response.weather[0].description,
      response.weather[0].icon
    );
  }

  // TODO: Complete buildForecastArray method: This method is used to display weather 
  // forcast for mulitple days
  private buildForecastArray(currentWeather: Weather, weatherData: any[]){
    const forecastArray = weatherData.map(data => new Weather(
      data.main.temp,
      data.weather[0].description,
      data.weather[0].icon
    ));
    
    // Adding current weather at the beginning of the array
    forecastArray.unshift(currentWeather);
    return forecastArray;
  }
  
  // TODO: Complete getWeatherForCity method
  async getWeatherForCity(city: string): Promise<Weather[]> {
    this.cityName = city;
    const coordinates = await this.fetchAndDestructureLocationData();
    const weatherData = await this.fetchWeatherData(coordinates);
    const currentWeather = this.parseCurrentWeather(weatherData);
    const forecastArray = this.buildForecastArray(currentWeather, weatherData.list)
    
    return forecastArray;
  }
}

export default new WeatherService();
