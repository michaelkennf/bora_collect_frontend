import React from 'react';
import NotificationToast from './NotificationToast';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          isVisible={true}
          onClose={() => onRemove(notification.id)}
          duration={notification.duration}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
