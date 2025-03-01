import { useEffect, useState } from 'react';
import { DatabaseService } from '@/services/database.service';
import { useAuth } from '@clerk/clerk-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/useToast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  created_at: string;
  type: string;
  details: any;
  read: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  strategies: {
    name: string;
  };
}

export default function NotificationsPage() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const dbService = new DatabaseService();

  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const data = await dbService.getNotifications(userId!);
      setNotifications(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notifications"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await dbService.markAllNotificationsAsRead(userId!);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notifications as read"
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await dbService.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      toast({
        title: "Success",
        description: "Notification deleted"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete notification"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TRADE_EXECUTED':
        return '💰';
      case 'TRADE_FAILED':
        return '❌';
      case 'STRATEGY_STARTED':
        return '🚀';
      case 'STRATEGY_STOPPED':
        return '🛑';
      default:
        return 'ℹ️';
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    const { type, details } = notification;

    switch (type) {
      case 'TRADE_EXECUTED':
        return (
          <div>
            <p className="font-medium">Trade Executed</p>
            <p className="text-sm text-gray-500">
              {details.side} {details.quantity} {details.symbol} @ {details.price}
            </p>
            <p className="text-xs text-gray-400">Order ID: {details.orderId}</p>
          </div>
        );

      case 'TRADE_FAILED':
        return (
          <div>
            <p className="font-medium">Trade Failed</p>
            <p className="text-sm text-gray-500">
              Failed to {details.side} {details.quantity} {details.symbol} @ {details.price}
            </p>
            <p className="text-xs text-red-500">{details.error}</p>
          </div>
        );

      default:
        return (
          <div>
            <p className="font-medium">{type}</p>
            <p className="text-sm text-gray-500">{JSON.stringify(details)}</p>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button onClick={markAllAsRead} disabled={!notifications.some(n => !n.read)}>
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trading Activity & Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {notifications.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.read ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div>
                          {renderNotificationContent(notification)}
                          <div className="mt-2 flex items-center space-x-2">
                            <Badge variant="outline">{notification.strategies.name}</Badge>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 