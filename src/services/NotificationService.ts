import { Notification, NotificationData } from '../models/Notification';
import { Weather } from '../models/Weather';

export interface NotificationMessage {
  id: string;
  locationName: string;
  message: string;
  timestamp: number;
}

type NotificationCallback = (message: NotificationMessage) => void;

export class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private storageKey: string = 'weatherapp_notifications';
  private subscribers: NotificationCallback[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public createNotification(data: NotificationData): Notification {
    const notification = new Notification(data);
    this.notifications.set(notification.id, notification);
    this.saveToStorage();
    return notification;
  }

  public getNotification(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  public getAllNotifications(): Notification[] {
    return Array.from(this.notifications.values());
  }

  public getNotificationsForLocation(locationId: string): Notification[] {
    return Array.from(this.notifications.values()).filter(
      (n) => n.locationId === locationId
    );
  }

  public updateNotification(notification: Notification): boolean {
    if (!this.notifications.has(notification.id)) {
      return false;
    }
    this.notifications.set(notification.id, notification);
    this.saveToStorage();
    return true;
  }

  public removeNotification(id: string): boolean {
    const result = this.notifications.delete(id);
    if (result) {
      this.saveToStorage();
    }
    return result;
  }

  public checkAndNotify(locationId: string, weather: Weather): void {
    const notifications = this.getNotificationsForLocation(locationId);

    notifications.forEach((notification) => {
      if (!notification.enabled) {
        return;
      }

      notification.conditions.forEach((condition) => {
        let shouldTrigger = false;

        switch (condition.type) {
          case 'temperature':
            shouldTrigger = notification.shouldTrigger(
              'temperature',
              weather.temperature
            );
            break;
          case 'humidity':
            shouldTrigger = notification.shouldTrigger(
              'humidity',
              weather.humidity
            );
            break;
          case 'windSpeed':
            shouldTrigger = notification.shouldTrigger(
              'windSpeed',
              weather.windSpeed
            );
            break;
          case 'weatherCondition':
            shouldTrigger = notification.shouldTrigger(
              'weatherCondition',
              weather.description
            );
            break;
        }

        if (shouldTrigger) {
          this.notify({
            id: notification.id,
            locationName: notification.locationName,
            message: `Weather alert: ${condition.type} changed for ${notification.locationName}`,
            timestamp: Date.now()
          });
        }
      });
    });
  }

  public subscribe(callback: NotificationCallback): void {
    this.subscribers.push(callback);
  }

  public unsubscribe(callback: NotificationCallback): void {
    this.subscribers = this.subscribers.filter((cb) => cb !== callback);
  }

  private notify(message: NotificationMessage): void {
    this.subscribers.forEach((callback) => callback(message));
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.notifications.values()).map((n) => ({
        id: n.id,
        locationId: n.locationId,
        locationName: n.locationName,
        conditions: n.conditions,
        enabled: n.enabled,
        createdAt: n.createdAt
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
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            const notification = new Notification(item);
            this.notifications.set(notification.id, notification);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications.clear();
    }
  }
}
