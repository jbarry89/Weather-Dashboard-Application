import {promises as fs} from 'fs';
import {v4 as uuidv4} from 'uuid';

// TODO: Define a City class with name and id properties
class City{
  id: string;
  name: string;

constructor(id: string, name: string){
  this.id = id;
  this.name = name;
}

}
// TODO: Complete the HistoryService class
class HistoryService {
  // TODO: Define a read method that reads from the searchHistory.json file
  private async read() {
    return await fs.readFile('./db/searchHistory.json', {flag: '+a', encoding: 'utf8'});
  }

  // TODO: Define a write method that writes the updated cities array to the searchHistory.json file
  private async write(cities: City[]) {
    const data = JSON.stringify(cities, null, '\t');
    return await fs.writeFile('./db/searchHistory.json', data);
  }

  // TODO: Define a getCities method that reads the cities from the searchHistory.json file and returns them as an array of City objects
  async getCities() {
    return await this.read().then((cities) => {
      let parsedCities: City[];

      try {
        parsedCities = [].concat(JSON.parse(cities));
      } catch (err){
        parsedCities = [];
      }

      return parsedCities;
    });
  }

  // TODO Define an addCity method that adds a city to the searchHistory.json file
  async addCity(city: string) {
    if (!city){
      throw new Error('city cannot be blank');
    }
    
    const newCity: City = { name: city, id: uuidv4()};
    return await this.getCities()
      .then((cities) => {
        if (cities.find((index) => index.name === city)){
          return cities;
        }
        return [...cities, newCity];
      })
      .then((udpateCities) => this.write(udpateCities))
      .then(() => newCity);
  }

  // * BONUS TODO: Define a removeCity method that removes a city from the searchHistory.json file
  async removeCity(id: string) {
    return await this.getCities()
      .then ((cities) => cities.filter((city) => city.id !== id))
      .then((filterCities) => this.write(filterCities));
  }
}

export default new HistoryService();
