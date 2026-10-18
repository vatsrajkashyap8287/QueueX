// =====================================
// QueueX Browser Notification Service
// =====================================

// Check browser notification support
export const isNotificationSupported = () => {
  return (
    typeof window !== "undefined" &&
    "Notification" in window
  );
};

// Get current notification permission
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  return Notification.permission;
};

// Request permission from user
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  try {
    const permission =
      await Notification.requestPermission();

    return permission;

  } catch (error) {
    console.error(
      "Notification Permission Error:",
      error
    );

    return "error";
  }
};

// Show Your Turn notification
export const showYourTurnNotification = ({
  queueName,
  tokenNumber
}) => {
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    const notification = new Notification(
      "QueueX — Your Turn!",
      {
        body:
          `${queueName}: Token #${tokenNumber} is now being served. ` +
          "Please proceed to the counter.",

        icon: "/favicon.ico",

        tag: `queuex-token-${tokenNumber}`
      }
    );

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;

  } catch (error) {
    console.error(
      "Browser Notification Error:",
      error
    );

    return false;
  }
};