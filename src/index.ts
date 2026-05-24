/**
 * Weather Application Main Entry Point
 */

import { Weather, ForecastItem } from './models/Weather';
import { Location } from './models/Location';
import { NotificationCondition, NotificationType } from './models/Notification';
import { WeatherService } from './services/WeatherService';
import { FavoritesService } from './services/FavoritesService';
import { NotificationService, NotificationMessage } from './services/NotificationService';

// API Key - Replace with your OpenWeatherMap API key
const API_KEY = 'YOUR_API_KEY_HERE';

// Global instances
let weatherService: WeatherService;
let favoritesService: FavoritesService;
let notificationService: NotificationService;

let currentWeather: Weather | null = null;

/**
 * Initialize the application
 */
function init(): void {
  try {
    weatherService = new WeatherService(API_KEY);
    favoritesService = new FavoritesService();
    notificationService = new NotificationService();

    setupEventListeners();
    renderFavorites();
    renderNotifications();

    console.log('Weather App initialized successfully');
  } catch (error) {
    handleError('Failed to initialize app', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  const searchForm = document.getElementById('searchForm') as HTMLFormElement;
  const clearFavoritesBtn = document.getElementById('clearFavoritesBtn') as HTMLButtonElement;
  const addNotificationBtn = document.getElementById('addNotificationBtn') as HTMLButtonElement;
  const modal = document.getElementById('notificationModal') as HTMLDivElement;
  const closeBtn = modal.querySelector('.close') as HTMLElement;
  const notificationForm = document.getElementById('notificationForm') as HTMLFormElement;
  const notificationType = document.getElementById('notificationType') as HTMLSelectElement;

  if (searchForm) {
    searchForm.addEventListener('submit', handleSearch);
  }

  if (clearFavoritesBtn) {
    clearFavoritesBtn.addEventListener('click', handleClearFavorites);
  }

  if (addNotificationBtn) {
    addNotificationBtn.addEventListener('click', (): void => {
      modal.classList.remove('hidden');
      populateNotificationLocations();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (): void => {
      modal.classList.add('hidden');
    });
  }

  if (notificationType) {
    notificationType.addEventListener('change', handleNotificationTypeChange);
  }

  if (notificationForm) {
    notificationForm.addEventListener('submit', handleAddNotification);
  }

  if (modal) {
    modal.addEventListener('click', (event: MouseEvent): void => {
      if (event.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }

  // Subscribe to notification messages
  notificationService.subscribe(handleNotificationMessage);
}

/**
 * Handle search form submission
 */
async function handleSearch(event: Event): Promise<void> {
  event.preventDefault();

  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  const cityName = searchInput.value.trim();

  if (!cityName) {
    showMessage('Please enter a city name', 'error');
    return;
  }

  try {
    const response = await weatherService.searchLocations(cityName);

    if (!response.success || !response.data) {
      showMessage(response.error || 'No locations found', 'error');
      return;
    }

    renderSearchResults(response.data);
    searchInput.value = '';
  } catch (error) {
    handleError('Search failed', error);
  }
}

/**
 * Handle location selection from search results
 */
async function handleLocationSelect(location: Location): Promise<void> {
  try {
    // Fetch current weather
    const weatherResponse = await weatherService.getCurrentWeather(location);
    if (!weatherResponse.success || !weatherResponse.data) {
      showMessage(weatherResponse.error || 'Failed to fetch weather', 'error');
      return;
    }

    currentWeather = weatherResponse.data;
    renderCurrentWeather(location, currentWeather);

    // Fetch forecast
    const forecastResponse = await weatherService.getForecast(location);
    if (forecastResponse.success && forecastResponse.data) {
      renderForecast(forecastResponse.data);
    }

    // Check notifications for this location
    notificationService.checkAndNotify(location.id, currentWeather);
  } catch (error) {
    handleError('Failed to fetch weather data', error);
  }
}

/**
 * Render search results
 */
function renderSearchResults(locations: Location[]): void {
  const resultsContainer = document.getElementById('searchResults') as HTMLDivElement;
  resultsContainer.innerHTML = '';

  locations.forEach((location) => {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'search-result-info';

    const title = document.createElement('p');
    title.textContent = location.getFullName();
    title.style.fontWeight = 'bold';

    const coords = document.createElement('p');
    coords.textContent = `Coordinates: ${location.getCoordinates()}`;
    coords.style.fontSize = '0.9em';

    infoDiv.appendChild(title);
    infoDiv.appendChild(coords);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'search-result-buttons';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-primary';
    viewBtn.textContent = 'View Weather';
    viewBtn.addEventListener('click', (): Promise<void> => handleLocationSelect(location));

    const favoriteBtn = document.createElement('button');
    const isFavorite = favoritesService.isFavorite(location.id);
    favoriteBtn.className = `btn ${isFavorite ? 'btn-secondary' : 'btn-success'}`;
    favoriteBtn.textContent = isFavorite ? '★ Favorited' : '☆ Add to Favorites';
    favoriteBtn.addEventListener('click', (): void => handleToggleFavorite(location, favoriteBtn));

    buttonsDiv.appendChild(viewBtn);
    buttonsDiv.appendChild(favoriteBtn);

    resultItem.appendChild(infoDiv);
    resultItem.appendChild(buttonsDiv);

    resultsContainer.appendChild(resultItem);
  });
}

/**
 * Render current weather
 */
function renderCurrentWeather(location: Location, weather: Weather): void {
  const weatherContainer = document.getElementById('currentWeather') as HTMLDivElement;
  weatherContainer.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'weather-card';

  const locationName = document.createElement('h3');
  locationName.textContent = location.getFullName();

  const weatherInfo = document.createElement('div');
  weatherInfo.className = 'weather-info';

  const items = [
    { label: 'Temperature', value: `${weather.getTemperatureCelsius()}°C` },
    { label: 'Feels Like', value: `${Math.round(weather.feelsLike)}°C` },
    { label: 'Humidity', value: `${weather.humidity}%` },
    { label: 'Wind Speed', value: `${weather.windSpeed} m/s` },
    { label: 'Cloud Coverage', value: `${weather.cloudiness}%` },
    { label: 'Pressure', value: `${weather.pressure} hPa` }
  ];

  items.forEach((item) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'weather-item';

    const label = document.createElement('label');
    label.textContent = item.label;

    const value = document.createElement('value');
    value.textContent = item.value;

    itemDiv.appendChild(label);
    itemDiv.appendChild(value);
    weatherInfo.appendChild(itemDiv);
  });

  const addFavoriteBtn = document.createElement('button');
  addFavoriteBtn.className = 'btn btn-success add-favorite-btn';
  const isFavorite = favoritesService.isFavorite(location.id);
  addFavoriteBtn.textContent = isFavorite ? '★ Remove from Favorites' : '☆ Add to Favorites';
  addFavoriteBtn.addEventListener('click', (): void => {
    if (favoritesService.isFavorite(location.id)) {
      favoritesService.removeFavorite(location.id);
      addFavoriteBtn.textContent = '☆ Add to Favorites';
    } else {
      favoritesService.addFavorite(location);
      addFavoriteBtn.textContent = '★ Remove from Favorites';
    }
    renderFavorites();
  });

  card.appendChild(locationName);
  card.appendChild(weatherInfo);
  card.appendChild(addFavoriteBtn);

  weatherContainer.appendChild(card);
}

/**
 * Render forecast
 */
function renderForecast(forecast: ForecastItem[]): void {
  const weatherContainer = document.getElementById('currentWeather') as HTMLDivElement;

  const forecastSection = document.createElement('div');
  forecastSection.className = 'forecast-section';

  const title = document.createElement('h3');
  title.textContent = '5-Day Forecast';

  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'forecast-items';

  forecast.slice(0, 8).forEach((item) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'forecast-item';

    const time = document.createElement('div');
    time.className = 'time';
    const date = new Date(item.timestamp * 1000);
    time.textContent = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const temp = document.createElement('div');
    temp.className = 'temp';
    temp.textContent = `${Math.round(item.temperature)}°C`;

    const condition = document.createElement('div');
    condition.className = 'condition';
    condition.textContent = item.description;

    itemDiv.appendChild(time);
    itemDiv.appendChild(temp);
    itemDiv.appendChild(condition);
    itemsContainer.appendChild(itemDiv);
  });

  forecastSection.appendChild(title);
  forecastSection.appendChild(itemsContainer);
  weatherContainer.appendChild(forecastSection);
}

/**
 * Render favorites list
 */
function renderFavorites(): void {
  const favoritesList = document.getElementById('favoritesList') as HTMLDivElement;
  favoritesList.innerHTML = '';

  const favorites = favoritesService.getAllFavorites();

  if (favorites.length === 0) {
    favoritesList.innerHTML = '<p class="empty-message">No favorite locations yet</p>';
    return;
  }

  favorites.forEach((location) => {
    const item = document.createElement('div');
    item.className = 'favorite-item';

    const info = document.createElement('div');
    info.className = 'favorite-info';

    const h4 = document.createElement('h4');
    h4.textContent = location.getFullName();

    const p = document.createElement('p');
    p.textContent = location.getCoordinates();

    info.appendChild(h4);
    info.appendChild(p);

    const buttons = document.createElement('div');
    buttons.className = 'favorite-buttons';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-primary';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', (): Promise<void> => handleLocationSelect(location));

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-danger';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', (): void => handleRemoveFavorite(location));

    buttons.appendChild(viewBtn);
    buttons.appendChild(removeBtn);

    item.appendChild(info);
    item.appendChild(buttons);
    favoritesList.appendChild(item);
  });
}

/**
 * Handle toggle favorite
 */
function handleToggleFavorite(location: Location, button: HTMLButtonElement): void {
  if (favoritesService.isFavorite(location.id)) {
    favoritesService.removeFavorite(location.id);
    button.className = 'btn btn-success';
    button.textContent = '☆ Add to Favorites';
  } else {
    favoritesService.addFavorite(location);
    button.className = 'btn btn-secondary';
    button.textContent = '★ Favorited';
  }
  renderFavorites();
}

/**
 * Handle remove favorite
 */
function handleRemoveFavorite(location: Location): void {
  favoritesService.removeFavorite(location.id);
  renderFavorites();
  showMessage(`${location.name} removed from favorites`, 'success');
}

/**
 * Handle clear favorites
 */
function handleClearFavorites(): void {
  if (confirm('Are you sure you want to clear all favorites?')) {
    favoritesService.clearAll();
    renderFavorites();
    showMessage('All favorites cleared', 'success');
  }
}

/**
 * Populate notification locations dropdown
 */
function populateNotificationLocations(): void {
  const select = document.getElementById('notificationLocation') as HTMLSelectElement;
  const favorites = favoritesService.getAllFavorites();

  // Clear existing options except the first one
  while (select.options.length > 1) {
    select.remove(1);
  }

  if (favorites.length === 0) {
    const option = document.createElement('option');
    option.textContent = 'No favorite locations';
    option.disabled = true;
    select.appendChild(option);
    return;
  }

  favorites.forEach((location) => {
    const option = document.createElement('option');
    option.value = location.id;
    option.textContent = location.getFullName();
    select.appendChild(option);
  });
}

/**
 * Handle notification type change
 */
function handleNotificationTypeChange(): void {
  const notificationType = document.getElementById('notificationType') as HTMLSelectElement;
  const conditionFields = document.getElementById('conditionFields') as HTMLDivElement;
  const selectedType = notificationType.value as NotificationType;

  conditionFields.innerHTML = '';

  if (!selectedType) {
    return;
  }

  if (selectedType === 'temperature') {
    conditionFields.innerHTML = `
      <div class="form-group">
        <label for="tempOperator">When temperature is:</label>
        <select id="tempOperator">
          <option value="greater">Greater than</option>
          <option value="less">Less than</option>
          <option value="equal">Equal to</option>
        </select>
      </div>
      <div class="form-group">
        <label for="tempValue">Temperature (°C):</label>
        <input type="number" id="tempValue" step="0.1" required />
      </div>
    `;
  } else if (selectedType === 'humidity') {
    conditionFields.innerHTML = `
      <div class="form-group">
        <label for="humidityOperator">When humidity is:</label>
        <select id="humidityOperator">
          <option value="greater">Greater than</option>
          <option value="less">Less than</option>
          <option value="equal">Equal to</option>
        </select>
      </div>
      <div class="form-group">
        <label for="humidityValue">Humidity (%):</label>
        <input type="number" id="humidityValue" min="0" max="100" required />
      </div>
    `;
  } else if (selectedType === 'windSpeed') {
    conditionFields.innerHTML = `
      <div class="form-group">
        <label for="windOperator">When wind speed is:</label>
        <select id="windOperator">
          <option value="greater">Greater than</option>
          <option value="less">Less than</option>
          <option value="equal">Equal to</option>
        </select>
      </div>
      <div class="form-group">
        <label for="windValue">Wind Speed (m/s):</label>
        <input type="number" id="windValue" step="0.1" required />
      </div>
    `;
  } else if (selectedType === 'weatherCondition') {
    conditionFields.innerHTML = `
      <div class="form-group">
        <label for="conditionValue">Weather condition:</label>
        <select id="conditionValue" required>
          <option value="">Select condition</option>
          <option value="Sunny">Sunny</option>
          <option value="Cloudy">Cloudy</option>
          <option value="Rainy">Rainy</option>
          <option value="Snowy">Snowy</option>
          <option value="Storm">Storm</option>
        </select>
      </div>
    `;
  }
}

/**
 * Handle add notification
 */
async function handleAddNotification(event: Event): Promise<void> {
  event.preventDefault();

  const locationSelect = document.getElementById('notificationLocation') as HTMLSelectElement;
  const typeSelect = document.getElementById('notificationType') as HTMLSelectElement;

  const locationId = locationSelect.value;
  const type = typeSelect.value as NotificationType;

  if (!locationId || !type) {
    showMessage('Please select location and notification type', 'error');
    return;
  }

  const location = favoritesService.getFavorite(locationId);
  if (!location) {
    showMessage('Selected location not found', 'error');
    return;
  }

  const condition: NotificationCondition = { type };

  if (type === 'temperature' || type === 'humidity' || type === 'windSpeed') {
    const operatorInput = document.getElementById(
      `${type === 'temperature' ? 'temp' : type === 'humidity' ? 'humidity' : 'wind'}Operator`
    ) as HTMLSelectElement;
    const valueInput = document.getElementById(
      `${type === 'temperature' ? 'temp' : type === 'humidity' ? 'humidity' : 'wind'}Value`
    ) as HTMLInputElement;

    if (!operatorInput.value || !valueInput.value) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    condition.operator = operatorInput.value as 'greater' | 'less' | 'equal' | 'changed';
    condition.threshold = parseFloat(valueInput.value);
  } else if (type === 'weatherCondition') {
    const conditionSelect = document.getElementById('conditionValue') as HTMLSelectElement;
    if (!conditionSelect.value) {
      showMessage('Please select a weather condition', 'error');
      return;
    }
    condition.value = conditionSelect.value;
  }

  notificationService.createNotification({
    id: `notif_${Date.now()}`,
    locationId,
    locationName: location.getFullName(),
    conditions: [condition],
    enabled: true,
    createdAt: Date.now()
  });

  renderNotifications();

  const modal = document.getElementById('notificationModal') as HTMLDivElement;
  modal.classList.add('hidden');

  const form = document.getElementById('notificationForm') as HTMLFormElement;
  form.reset();

  showMessage(`Notification created for ${location.name}`, 'success');
}

/**
 * Render notifications
 */
function renderNotifications(): void {
  const notificationsList = document.getElementById('notificationsList') as HTMLDivElement;
  notificationsList.innerHTML = '';

  const notifications = notificationService.getAllNotifications();

  if (notifications.length === 0) {
    notificationsList.innerHTML =
      '<p class="empty-message">No notifications yet. Create one to get started!</p>';
    return;
  }

  notifications.forEach((notification) => {
    const item = document.createElement('div');
    item.className = 'notification-item';

    const h4 = document.createElement('h4');
    h4.textContent = notification.locationName;

    const conditions = document.createElement('div');
    conditions.className = 'notification-conditions';
    conditions.textContent = notification.getSummary();

    const status = document.createElement('div');
    status.className = 'notification-status';

    const badge = document.createElement('span');
    badge.className = `notification-status-badge ${notification.enabled ? 'enabled' : 'disabled'}`;
    badge.textContent = notification.enabled ? 'Enabled' : 'Disabled';

    const buttons = document.createElement('div');
    buttons.className = 'notification-buttons';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-secondary';
    toggleBtn.textContent = notification.enabled ? 'Disable' : 'Enable';
    toggleBtn.addEventListener('click', (): void => {
      notification.toggle();
      notificationService.updateNotification(notification);
      renderNotifications();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', (): void => {
      notificationService.removeNotification(notification.id);
      renderNotifications();
      showMessage('Notification deleted', 'success');
    });

    buttons.appendChild(toggleBtn);
    buttons.appendChild(deleteBtn);
    status.appendChild(badge);
    status.appendChild(buttons);

    item.appendChild(h4);
    item.appendChild(conditions);
    item.appendChild(status);
    notificationsList.appendChild(item);
  });
}

/**
 * Handle notification messages
 */
function handleNotificationMessage(message: NotificationMessage): void {
  const messagesContainer = document.getElementById('notificationMessages') as HTMLDivElement;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'notification-message';
  messageDiv.textContent = `${message.locationName}: ${message.message}`;

  messagesContainer.appendChild(messageDiv);

  // Auto-remove after 5 seconds
  setTimeout((): void => {
    messageDiv.remove();
  }, 5000);
}

/**
 * Show message
 */
function showMessage(text: string, type: 'success' | 'error' = 'success'): void {
  const messagesContainer = document.getElementById('notificationMessages') as HTMLDivElement;

  if (!messagesContainer) {
    return;
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `notification-message ${type === 'error' ? 'error' : 'success'}`;
  messageDiv.textContent = text;

  if (type === 'error') {
    messageDiv.style.background = '#f8d7da';
    messageDiv.style.color = '#721c24';
    messageDiv.style.borderLeft = '4px solid #f5c6cb';
  }

  messagesContainer.appendChild(messageDiv);

  setTimeout((): void => {
    messageDiv.remove();
  }, 4000);
}

/**
 * Handle errors
 */
function handleError(message: string, error: unknown): void {
  console.error(message, error);
  showMessage(`${message}: ${error instanceof Error ? error.message : String(error)}`, 'error');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
