import { Location, LocationData } from '../models/Location';

describe('Location Model', () => {
  let locationData: LocationData;

  beforeEach(() => {
    locationData = {
      id: 'loc_1',
      name: 'London',
      country: 'UK',
      latitude: 51.5074,
      longitude: -0.1278,
      state: 'England'
    };
  });

  test('should create a Location instance with correct properties', () => {
    const location = new Location(locationData);

    expect(location.id).toBe('loc_1');
    expect(location.name).toBe('London');
    expect(location.country).toBe('UK');
    expect(location.latitude).toBe(51.5074);
    expect(location.longitude).toBe(-0.1278);
    expect(location.state).toBe('England');
  });

  test('should return correct full name with state', () => {
    const location = new Location(locationData);

    expect(location.getFullName()).toBe('London, England, UK');
  });

  test('should return correct full name without state', () => {
    const dataWithoutState: LocationData = {
      ...locationData,
      state: undefined
    };
    const location = new Location(dataWithoutState);

    expect(location.getFullName()).toBe('London, UK');
  });

  test('should return correct coordinates format', () => {
    const location = new Location(locationData);
    const coords = location.getCoordinates();

    expect(coords).toContain('51.5074');
    expect(coords).toContain('-0.1278');
  });

  test('should validate correct location', () => {
    const location = new Location(locationData);

    expect(location.isValid()).toBe(true);
  });

  test('should reject location with empty name', () => {
    const invalidData: LocationData = { ...locationData, name: '' };
    const location = new Location(invalidData);

    expect(location.isValid()).toBe(false);
  });

  test('should reject location with empty country', () => {
    const invalidData: LocationData = { ...locationData, country: '' };
    const location = new Location(invalidData);

    expect(location.isValid()).toBe(false);
  });

  test('should reject location with invalid latitude', () => {
    const invalidData: LocationData = { ...locationData, latitude: 91 };
    const location = new Location(invalidData);

    expect(location.isValid()).toBe(false);

    const invalidData2: LocationData = { ...locationData, latitude: -91 };
    const location2 = new Location(invalidData2);

    expect(location2.isValid()).toBe(false);
  });

  test('should reject location with invalid longitude', () => {
    const invalidData: LocationData = { ...locationData, longitude: 181 };
    const location = new Location(invalidData);

    expect(location.isValid()).toBe(false);

    const invalidData2: LocationData = { ...locationData, longitude: -181 };
    const location2 = new Location(invalidData2);

    expect(location2.isValid()).toBe(false);
  });

  test('should calculate distance between two locations', () => {
    const london = new Location(locationData);
    const parisData: LocationData = {
      id: 'loc_2',
      name: 'Paris',
      country: 'France',
      latitude: 48.8566,
      longitude: 2.3522
    };
    const paris = new Location(parisData);

    const distance = london.calculateDistance(paris);

    // Distance between London and Paris is approximately 343 km
    expect(distance).toBeGreaterThan(340);
    expect(distance).toBeLessThan(350);
  });

  test('should calculate zero distance to same location', () => {
    const london = new Location(locationData);
    const sameLocation = new Location(locationData);

    const distance = london.calculateDistance(sameLocation);

    expect(distance).toBeCloseTo(0, 1);
  });

  test('should handle poles correctly', () => {
    const northPole: LocationData = {
      id: 'pole_n',
      name: 'North Pole',
      country: 'Arctic',
      latitude: 90,
      longitude: 0
    };
    const pole = new Location(northPole);

    expect(pole.isValid()).toBe(true);
  });

  test('should handle equator correctly', () => {
    const equator: LocationData = {
      id: 'eq',
      name: 'Equator',
      country: 'Earth',
      latitude: 0,
      longitude: 0
    };
    const eq = new Location(equator);

    expect(eq.isValid()).toBe(true);
  });
});
