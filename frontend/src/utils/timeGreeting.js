// =========================================================
// TIME-BASED GREETING UTILITY FOR LUMILEX
// Dynamically greets the child based on their local time of day:
// - Morning (5:00 AM - 11:59 AM)
// - Afternoon (12:00 PM - 4:59 PM)
// - Evening (5:00 PM - 8:59 PM)
// - Night / Late (9:00 PM - 4:59 AM)
// =========================================================

export function getTimeGreeting(childName = "") {
  const hour = new Date().getHours();
  let greeting = "Good morning";
  let emoji = "🌅";
  let subtitle = "Let's make today's reading adventure bright and fun!";

  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon";
    emoji = "☀️";
    subtitle = "Ready for a cheerful afternoon reading adventure?";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good evening";
    emoji = "🌆";
    subtitle = "A cozy evening story is waiting for you!";
  } else if (hour >= 21 || hour < 5) {
    greeting = "Welcome back";
    emoji = "🌙";
    subtitle = "A peaceful bedtime tale makes reading dreams sweet!";
  }

  const namePart = childName ? `, ${childName}` : "";

  return {
    greeting,
    emoji,
    fullGreeting: `${greeting}${namePart} ${emoji}`,
    subtitle,
    hour,
  };
}
