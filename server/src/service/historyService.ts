import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";

// TODO: Define a City class with name and id properties
class City {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
// TODO: Complete the HistoryService class
class HistoryService {
  // TODO: Define a read method that reads from the searchHistory.json file
  private async read() {
    try {
      const data = await fs.readFile("./db/searchHistory.json", "utf8");
      return JSON.parse(data);
    } catch (err) {
      console.error("Error reading search history file:", err);
      throw err;
    }
  }

  // TODO: Define a write method that writes the updated cities array to the searchHistory.json file
  private async write(cities: City[]): Promise<void> {
    try {
      const data = JSON.stringify(cities, null, "\t");
      await fs.writeFile("./db/searchHistory.json", data);
    } catch (err) {
      console.error("Error writing to search history file:", err);
      throw err;
    }
  }

  // TODO: Define a getCities method that reads the cities from the searchHistory.json file and returns them as an array of City objects
  async getCities(): Promise<City[]> {
    try {
      const cities = await this.read();
      return cities;
    } catch (err) {
      console.error("Error getting cities:", err);
      return [];
    }
  }

  // TODO Define an addCity method that adds a city to the searchHistory.json file
  async addCity(city: string) {
    if (!city) {
      throw new Error("city cannot be blank");
    }

    const newCity = new City(uuidv4(), city);
    const cities = await this.getCities();

    if (!cities.find((existingCity) => existingCity.name === city)) {
      cities.push(newCity);
      await this.write(cities);
    }

    return newCity;
  }

  // * BONUS TODO: Define a removeCity method that removes a city from the searchHistory.json file
  async removeCity(id: string): Promise<void> {
    try {
      const cities = await this.getCities();
      const filteredCities = cities.filter((city) => city.id !== id);
      await this.write(filteredCities);
    } catch (err) {
      console.error("Error: Not able to remove city:", err);
      throw err;
    }
  }
}

export default new HistoryService();
