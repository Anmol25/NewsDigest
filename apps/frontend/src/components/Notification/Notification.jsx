import { useState, useEffect } from 'react';
import './Notification.css';

function Notification() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const handleNotification = (event) => {
      setNotification(event.detail);
      
      const timeoutId = setTimeout(() => {
        setNotification(null);
      }, 3000);

      return () => clearTimeout(timeoutId);
    };

    window.addEventListener('showNotification', handleNotification);
    
    return () => {
      window.removeEventListener('showNotification', handleNotification);
    };
  }, []);

  if (!notification) return null;

  return (
    <div className={`notification ${notification.type}`}>
      {notification.message}
    </div>
  );
}

export default Notification;
