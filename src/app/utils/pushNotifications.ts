import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { getApiUrl } from '../lib/apiUrl';

const API_URL = getApiUrl();

export class PushNotificationService {
  private static isInitialized = false;
  private static fcmToken: string | null = null;

  static async initialize(getAccessToken: () => string | null): Promise<void> {
    if (this.isInitialized) return;
    
    // Only initialize on mobile platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        // Register with FCM/APNs
        await PushNotifications.register();
        
        // Listen for registration success
        await PushNotifications.addListener('registration', async (token: Token) => {
          console.log('Push registration success, token:', token.value);
          this.fcmToken = token.value;
          
          // Send token to backend
          await this.sendTokenToBackend(token.value, getAccessToken);
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Push registration error:', error);
        });

        // Listen for push notifications received
        await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('Push notification received:', notification);
          
          // Show local notification if app is in foreground
          this.showLocalNotification(notification);
        });

        // Listen for notification actions (user tapped notification)
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
          console.log('Push notification action performed:', notification);
          
          // Handle notification tap - navigate to relevant screen
          this.handleNotificationTap(notification);
        });

        this.isInitialized = true;
        console.log('Push notifications initialized successfully');
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private static async sendTokenToBackend(token: string, getAccessToken: () => string | null): Promise<void> {
    try {
      const authToken = getAccessToken();
      if (!authToken) {
        console.log('No auth token available, skipping token registration');
        return;
      }

      const response = await fetch(`${API_URL}/notifications/register-device/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fcm_token: token,
          platform: Capacitor.getPlatform(),
        }),
      });

      if (response.ok) {
        console.log('Device token registered with backend');
      } else {
        console.error('Failed to register device token:', await response.text());
      }
    } catch (error) {
      console.error('Error sending token to backend:', error);
    }
  }

  private static showLocalNotification(notification: PushNotificationSchema): void {
    // You can customize how notifications appear when app is in foreground
    console.log('Showing local notification:', notification.title);
  }

  private static handleNotificationTap(notification: ActionPerformed): void {
    const data = notification.notification.data;
    
    // Navigate based on notification type
    if (data.type === 'task_reminder') {
      // Navigate to task detail
      window.location.href = `/#/task/${data.task_id}`;
    } else if (data.type === 'task_completed') {
      // Navigate to progress page
      window.location.href = '/#/progress';
    } else if (data.type === 'pet_update') {
      // Show pet
      window.location.href = '/#/';
    }
  }

  static async getDeliveredNotifications(): Promise<PushNotificationSchema[]> {
    if (!Capacitor.isNativePlatform()) return [];
    
    try {
      const result = await PushNotifications.getDeliveredNotifications();
      return result.notifications;
    } catch (error) {
      console.error('Error getting delivered notifications:', error);
      return [];
    }
  }

  static async removeDeliveredNotifications(notifications: PushNotificationSchema[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await PushNotifications.removeDeliveredNotifications({ notifications });
    } catch (error) {
      console.error('Error removing delivered notifications:', error);
    }
  }

  static async removeAllDeliveredNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await PushNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error('Error removing all delivered notifications:', error);
    }
  }

  static getToken(): string | null {
    return this.fcmToken;
  }

  static async unregister(getAccessToken: () => string | null): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      // Unregister from backend
      if (this.fcmToken) {
        const authToken = getAccessToken();
        if (authToken) {
          await fetch(`${API_URL}/notifications/unregister-device/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              fcm_token: this.fcmToken,
            }),
          });
        }
      }

      // Unregister from FCM/APNs
      await PushNotifications.unregister();
      this.fcmToken = null;
      this.isInitialized = false;
      
      console.log('Push notifications unregistered');
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
    }
  }
}
