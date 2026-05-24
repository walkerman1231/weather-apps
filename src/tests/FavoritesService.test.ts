import { FavoritesService } from '../services/FavoritesService';
import { Location, LocationData } from '../models/Location';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('FavoritesService', () => {
  let favoritesService: FavoritesService;
  let testLocation: Location;

  beforeEach(() => {
    localStorage.clear();
    favoritesService = new FavoritesService();

    const locationData: LocationData = {
      id: 'loc_1',
      name: 'London',
      country: 'UK',
      latitude: 51.5074,
      longitude: -0.1278
    };
    testLocation = new Location(locationData);
  });

  test('should add favorite location', () => {
    const result = favoritesService.addFavorite(testLocation);

    expect(result).toBe(true);
    expect(favoritesService.getFavoriteCount()).toBe(1);
  });

  test('should not add invalid location', () => {
    const invalidLocationData: LocationData = {
      id: 'invalid',
      name: '',
      country: 'UK',
      latitude: 51.5074,
      longitude: -0.1278
    };
    const invalidLocation = new Location(invalidLocationData);

    const result = favoritesService.addFavorite(invalidLocation);

    expect(result).toBe(false);
    expect(favoritesService.getFavoriteCount()).toBe(0);
  });

  test('should not add duplicate favorite', () => {
    favoritesService.addFavorite(testLocation);
    const result = favoritesService.addFavorite(testLocation);

    expect(result).toBe(false);
    expect(favoritesService.getFavoriteCount()).toBe(1);
  });

  test('should remove favorite location', () => {
    favoritesService.addFavorite(testLocation);
    const result = favoritesService.removeFavorite('loc_1');

    expect(result).toBe(true);
    expect(favoritesService.getFavoriteCount()).toBe(0);
  });

  test('should not remove non-existent favorite', () => {
    const result = favoritesService.removeFavorite('non_existent');

    expect(result).toBe(false);
  });

  test('should get all favorites', () => {
    const location1 = testLocation;

    const location2Data: LocationData = {
      id: 'loc_2',
      name: 'Paris',
      country: 'France',
      latitude: 48.8566,
      longitude: 2.3522
    };
    const location2 = new Location(location2Data);

    favoritesService.addFavorite(location1);
    favoritesService.addFavorite(location2);

    const favorites = favoritesService.getAllFavorites();

    expect(favorites.length).toBe(2);
  });

  test('should get favorite by ID', () => {
    favoritesService.addFavorite(testLocation);

    const favorite = favoritesService.getFavorite('loc_1');

    expect(favorite).toEqual(testLocation);
  });

  test('should return undefined for non-existent favorite', () => {
    const favorite = favoritesService.getFavorite('non_existent');

    expect(favorite).toBeUndefined();
  });

  test('should check if location is favorite', () => {
    favoritesService.addFavorite(testLocation);

    expect(favoritesService.isFavorite('loc_1')).toBe(true);
    expect(favoritesService.isFavorite('non_existent')).toBe(false);
  });

  test('should clear all favorites', () => {
    const location1 = testLocation;

    const location2Data: LocationData = {
      id: 'loc_2',
      name: 'Paris',
      country: 'France',
      latitude: 48.8566,
      longitude: 2.3522
    };
    const location2 = new Location(location2Data);

    favoritesService.addFavorite(location1);
    favoritesService.addFavorite(location2);

    favoritesService.clearAll();

    expect(favoritesService.getFavoriteCount()).toBe(0);
  });

  test('should persist favorites to localStorage', () => {
    favoritesService.addFavorite(testLocation);

    const stored = localStorage.getItem('weatherapp_favorites');

    expect(stored).not.toBeNull();
    expect(stored).toContain('London');
  });

  test('should load favorites from localStorage', () => {
    favoritesService.addFavorite(testLocation);

    // Create a new service instance to test loading
    const newService = new FavoritesService();

    expect(newService.getFavoriteCount()).toBe(1);
    expect(newService.isFavorite('loc_1')).toBe(true);
  });

  test('should handle empty localStorage', () => {
    const newService = new FavoritesService();

    expect(newService.getFavoriteCount()).toBe(0);
  });
});
