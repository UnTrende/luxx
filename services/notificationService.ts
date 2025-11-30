
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  // Check if the browser supports notifications
  if (!('Notification' in window)) {
    console.log("This browser does not support desktop notification.");
    return "denied";
  }

  // Check if permission is already granted
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // Otherwise, ask the user for permission
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return "denied";
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) {
    console.log("This browser does not support notifications.");
    return;
  }
  
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      ...options,
      icon: '/favicon.ico', // Optional: Add a default icon
    });
  } else if (Notification.permission === 'default') {
    console.log("Notification permission has not been requested yet.");
    // Optionally, you could trigger a permission request here
    // requestNotificationPermission().then(permission => {
    //   if (permission === 'granted') {
    //     new Notification(title, options);
    //   }
    // });
  } else {
    console.log("Notification permission was denied.");
  }
};