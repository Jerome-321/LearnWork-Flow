import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Task } from '../types/task';

export class NotificationScheduler {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized || !Capacitor.isNativePlatform()) {
      this.isInitialized = true; // Mark as initialized even on web
      return;
    }

    try {
      // Request permission for local notifications
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        this.isInitialized = true;
        console.log('Local notifications initialized');
      } else {
        this.isInitialized = true; // Still mark as initialized to prevent blocking
        console.log('Local notifications permission denied');
      }
    } catch (error) {
      console.error('Error initializing local notifications:', error);
      this.isInitialized = true; // Mark as initialized to prevent blocking
    }
  }

  /**
   * Schedule notifications for a task based on its due date
   */
  static async scheduleTaskReminders(task: Task): Promise<void> {
    if (!Capacitor.isNativePlatform() || task.completed) {
      return;
    }

    try {
      const dueDate = new Date(task.dueDate);
      const now = new Date();

      // Don't schedule if task is already overdue
      if (dueDate <= now) {
        return;
      }

      const notifications = [];

      // 1 day before (if more than 1 day away)
      const oneDayBefore = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
      if (oneDayBefore > now) {
        notifications.push({
          id: parseInt(`${task.id.replace(/\D/g, '').slice(0, 8)}1`),
          title: ' Task Due Tomorrow',
          body: `"${task.title}" is due tomorrow at ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
          schedule: { at: oneDayBefore },
          extra: {
            taskId: task.id,
            type: 'reminder_1day',
          },
        });
      }

      // 1 hour before
      const oneHourBefore = new Date(dueDate.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > now) {
        notifications.push({
          id: parseInt(`${task.id.replace(/\D/g, '').slice(0, 8)}2`),
          title: ' Task Due Soon',
          body: `"${task.title}" is due in 1 hour!`,
          schedule: { at: oneHourBefore },
          extra: {
            taskId: task.id,
            type: 'reminder_1hour',
          },
        });
      }

      // 15 minutes before
      const fifteenMinBefore = new Date(dueDate.getTime() - 15 * 60 * 1000);
      if (fifteenMinBefore > now) {
        notifications.push({
          id: parseInt(`${task.id.replace(/\D/g, '').slice(0, 8)}3`),
          title: ' Task Due Very Soon!',
          body: `"${task.title}" is due in 15 minutes!`,
          schedule: { at: fifteenMinBefore },
          extra: {
            taskId: task.id,
            type: 'reminder_15min',
          },
        });
      }

      // At due time
      if (dueDate > now) {
        notifications.push({
          id: parseInt(`${task.id.replace(/\D/g, '').slice(0, 8)}4`),
          title: ' Task Deadline Reached',
          body: `"${task.title}" is due now!`,
          schedule: { at: dueDate },
          extra: {
            taskId: task.id,
            type: 'reminder_due',
          },
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} reminders for task: ${task.title}`);
      }
    } catch (error) {
      console.error('Error scheduling task reminders:', error);
    }
  }

  /**
   * Cancel all notifications for a specific task
   */
  static async cancelTaskReminders(taskId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const notificationIds = [1, 2, 3, 4].map(suffix => 
        parseInt(`${taskId.replace(/\D/g, '').slice(0, 8)}${suffix}`)
      );

      await LocalNotifications.cancel({ notifications: notificationIds.map(id => ({ id })) });
      console.log(`Cancelled reminders for task: ${taskId}`);
    } catch (error) {
      console.error('Error cancelling task reminders:', error);
    }
  }

  /**
   * Reschedule all task reminders
   */
  static async rescheduleAllTasks(tasks: Task[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Cancel all existing notifications
      await LocalNotifications.cancel({ notifications: [] });

      // Schedule reminders for all incomplete tasks
      const incompleteTasks = tasks.filter(t => !t.completed);
      
      for (const task of incompleteTasks) {
        await this.scheduleTaskReminders(task);
      }

      console.log(`Rescheduled reminders for ${incompleteTasks.length} tasks`);
    } catch (error) {
      console.error('Error rescheduling all tasks:', error);
    }
  }

  /**
   * Send immediate notification (for task completion, etc.)
   */
  static async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const id = Date.now();
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
            extra: data,
          },
        ],
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  /**
   * Schedule daily summary notification
   */
  static async scheduleDailySummary(hour: number = 8, minute: number = 0): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999999, // Fixed ID for daily summary
            title: ' Daily Task Summary',
            body: 'Check your tasks for today!',
            schedule: {
              at: scheduledTime,
              every: 'day',
            },
            extra: {
              type: 'daily_summary',
            },
          },
        ],
      });

      console.log(`Daily summary scheduled for ${hour}:${minute}`);
    } catch (error) {
      console.error('Error scheduling daily summary:', error);
    }
  }

  /**
   * Get all pending notifications
   */
  static async getPendingNotifications(): Promise<any[]> {
    if (!Capacitor.isNativePlatform()) return [];

    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Cancel all notifications
   */
  static async cancelAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }
}
