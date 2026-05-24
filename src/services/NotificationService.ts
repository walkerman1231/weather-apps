import { Notification, NotificationData, NotificationType } from '../models/Notification';
import { Weather } from '../models/Weather';

export class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private storageKey: string = 'weather_notifications';
  private initialized: boolean = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }
    this.loadFromStorage();
    this.initialized = true;
  }

  createNotification(data: NotificationData): Notification {
    this.ensureInitialized();
    const notification = new Notification(data);
    this.notifications.set(notification.id, notification);
    this.saveToStorage();
    return notification;
  }

  getNotifications(): Notification[] {
    this.ensureInitialized();
    return Array.from(this.notifications.values());
  }

  getNotificationsByLocation(locationName: string): Notification[] {
    this.ensureInitialized();
    return Array.from(this.notifications.values()).filter(
      (n) => n.locationName === locationName
    );
  }

  getNotificationById(id: string): Notification | null {
    this.ensureInitialized();
    return this.notifications.get(id) || null;
  }

  deleteNotification(id: string): boolean {
    this.ensureInitialized();
    const result = this.notifications.delete(id);
    if (result) {
      this.saveToStorage();
    }
    return result;
  }

  toggleNotification(id: string): Notification | null {
    this.ensureInitialized();
    const notification = this.notifications.get(id);
    if (notification) {
      notification.toggle();
      this.saveToStorage();
      return notification;
    }
    return null;
  }

  checkNotifications(locationName: string, weather: Weather): Notification[] {
    this.ensureInitialized();
    const triggered: Notification[] = [];
    const notifications = this.getNotificationsByLocation(locationName);

    for (const notification of notifications) {
      if (!notification.enabled) {
        continue;
      }

      let shouldTrigger = false;

      switch (notification.type) {
        case NotificationType.TEMPERATURE_ABOVE:
        case NotificationType.TEMPERATURE_BELOW:
        case NotificationType.TEMPERATURE_EQUAL:
          shouldTrigger = notification.shouldTrigger(weather.temperature);
          break;
        case NotificationType.HUMIDITY_ABOVE:
        case NotificationType.HUMIDITY_BELOW:
        case NotificationType.HUMIDITY_EQUAL:
          shouldTrigger = notification.shouldTrigger(weather.humidity);
          break;
        case NotificationType.WIND_SPEED_ABOVE:
        case NotificationType.WIND_SPEED_BELOW:
          shouldTrigger = notification.shouldTrigger(weather.windSpeed);
          break;
        case NotificationType.CONDITION_MATCH:
          shouldTrigger = notification.matchesCondition(weather.condition);
          break;
      }

      if (shouldTrigger) {
        notification.recordTrigger();
        triggered.push(notification);
        this.saveToStorage();
      }
    }

    return triggered;
  }

  clearAllNotifications(): number {
    this.ensureInitialized();
    const count = this.notifications.size;
    this.notifications.clear();
    this.saveToStorage();
    return count;
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.notifications.values()).map((n) => ({
        id: n.id,
        locationName: n.locationName,
        type: n.type,
        threshold: n.threshold,
        condition: n.condition,
        enabled: n.enabled,
        createdAt: n.createdAt,
        lastTriggeredAt: n.lastTriggeredAt,
        triggerCount: n.triggerCount
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.notifications.clear();
        for (const item of parsed) {
          const notification = new Notification({
            id: item.id,
            locationName: item.locationName,
            type: item.type,
            threshold: item.threshold,
            condition: item.condition,
            enabled: item.enabled,
            createdAt: item.createdAt,
            lastTriggeredAt: item.lastTriggeredAt,
            triggerCount: item.triggerCount
          });
          this.notifications.set(notification.id, notification);
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications.clear();
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }
}