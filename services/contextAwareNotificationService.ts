import * as Calendar from "expo-calendar";
import * as Notifications from "expo-notifications";

export type ExpenseItem = {
  amount: number;
  category?: string;
  date: any;
};

type Suggestion = {
  title: string;
  body: string;
  triggerDate: Date;
  meta?: {
    eventTitle?: string;
    daysBefore?: number;
    eventType?: "celebration" | "weekend" | "transport" | "spending";
  };
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CELEBRATION_KEYWORDS = [
  "birthday",
  "party",
  "wedding",
  "anniversary",
  "celebration",
  "dinner",
  "gathering",
  "reunion",
  "event",
];

const REMINDER_DAYS = [7, 5, 3, 1];

// IMPORTANT: replace with your laptop IP if it changes
const AI_API_URL = "http://192.168.1.104:5000/generate-reminder-message";

function toDate(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function subtractDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function isWeekendComingSoon() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun, 5 Fri, 6 Sat
  return day === 5 || day === 6 || day === 0;
}

function isCelebrationEvent(title?: string) {
  if (!title) return false;
  const lower = title.toLowerCase();
  return CELEBRATION_KEYWORDS.some((k) => lower.includes(k));
}

function getCategoryTotal(
  expenses: ExpenseItem[],
  category: string,
  fromDate: Date,
  endDate: Date
) {
  return expenses
    .filter((e) => {
      const d = toDate(e.date);
      return (
        d &&
        d >= fromDate &&
        d <= endDate &&
        (e.category || "").toLowerCase() === category.toLowerCase()
      );
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

function getRecentTrend(expenses: ExpenseItem[], category: string) {
  const now = new Date();
  const last7Start = daysAgo(7);
  const prev14Start = daysAgo(14);
  const prev7End = daysAgo(7);

  const last7 = getCategoryTotal(expenses, category, last7Start, now);
  const prev7 = getCategoryTotal(expenses, category, prev14Start, prev7End);

  return { last7, prev7 };
}

function buildSuggestions(events: Calendar.Event[], expenses: ExpenseItem[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const now = new Date();

  const diningTrend = getRecentTrend(expenses, "dining");
  const entertainmentTrend = getRecentTrend(expenses, "entertainment");
  const transportTrend = getRecentTrend(expenses, "transportation");

  // 1) Weekend reminders
  if (isWeekendComingSoon()) {
    if (diningTrend.last7 > diningTrend.prev7 && diningTrend.last7 > 0) {
      suggestions.push({
        title: "Weekend Spending Reminder",
        body: "It’s the weekend, and your dining spending has been higher than usual recently.",
        triggerDate: new Date(now.getTime() + 60 * 1000),
        meta: { eventType: "weekend" },
      });
    }

    if (
      entertainmentTrend.last7 > entertainmentTrend.prev7 &&
      entertainmentTrend.last7 > 0
    ) {
      suggestions.push({
        title: "Weekend Expense Insight",
        body: "Your entertainment spending has increased recently. Consider keeping weekend spending in check.",
        triggerDate: new Date(now.getTime() + 2 * 60 * 1000),
        meta: { eventType: "weekend" },
      });
    }
  }

  // 2) Celebration reminders 7, 5, 3, 1 days before
  for (const event of events) {
    const start = new Date(event.startDate);
    const eventTitle = event.title || "Upcoming Event";

    if (!isCelebrationEvent(eventTitle)) continue;

    for (const daysBefore of REMINDER_DAYS) {
      const trigger = subtractDays(start, daysBefore);

      if (trigger > now) {
        suggestions.push({
          title: "Upcoming Celebration",
          body: `You have "${eventTitle}" coming in ${daysBefore} day${daysBefore > 1 ? "s" : ""}. You may want to expect extra dining, gift, or transport spending.`,
          triggerDate: trigger,
          meta: {
            eventTitle,
            daysBefore,
            eventType: "celebration",
          },
        });
      }
    }

    // same-day fallback if event is within 24h
    const hoursUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil > 0 && hoursUntil <= 24) {
      suggestions.push({
        title: "Upcoming Celebration",
        body: `You have "${eventTitle}" coming soon. You may want to expect extra dining, gift, or transport spending.`,
        triggerDate: new Date(now.getTime() + 60 * 1000),
        meta: {
          eventTitle,
          daysBefore: 0,
          eventType: "celebration",
        },
      });
    }

    // extra spending insight
    if (diningTrend.last7 > diningTrend.prev7 && diningTrend.last7 > 0) {
      const trigger = new Date(
        Math.max(
          now.getTime() + 2 * 60 * 1000,
          start.getTime() - 24 * 60 * 60 * 1000
        )
      );

      if (trigger > now) {
        suggestions.push({
          title: "Spending Insight",
          body: `Your dining spending is already higher than usual, and "${eventTitle}" is coming up soon.`,
          triggerDate: trigger,
          meta: {
            eventTitle,
            eventType: "spending",
          },
        });
      }
    }
  }

  // 3) Upcoming event + higher transport trend
  if (
    events.length > 0 &&
    transportTrend.last7 > transportTrend.prev7 &&
    transportTrend.last7 > 0
  ) {
    const nextEvent = events[0];
    const start = new Date(nextEvent.startDate);

    suggestions.push({
      title: "Transport Spending Reminder",
      body: `You have "${nextEvent.title}" coming up, and your recent transport spending has increased.`,
      triggerDate: new Date(
        Math.max(
          now.getTime() + 3 * 60 * 1000,
          start.getTime() - 2 * 60 * 60 * 1000
        )
      ),
      meta: {
        eventTitle: nextEvent.title || "Upcoming Event",
        eventType: "transport",
      },
    });
  }

  return suggestions;
}

async function generateAiReminderMessage(input: {
  eventTitle?: string;
  daysBefore?: number;
  eventType?: string;
  diningHigh?: boolean;
  entertainmentHigh?: boolean;
  transportHigh?: boolean;
}) {
  try {
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      console.log("AI API failed:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data?.success || !data?.message) {
      return null;
    }

    return data.message as string;
  } catch (error) {
    console.log("AI reminder generation failed:", error);
    return null;
  }
}

export async function requestCalendarPermission() {
  const result = await Calendar.requestCalendarPermissionsAsync();
  return result.status === "granted";
}

export async function requestNotificationPermission() {
  const result = await Notifications.requestPermissionsAsync();
  return result.status === "granted";
}

export async function getUpcomingEvents(hoursAhead = 24 * 30) {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const calendarIds = calendars.map((c) => c.id);

  const now = new Date();
  const end = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const events = await Calendar.getEventsAsync(calendarIds, now, end);

  return events
    .filter((e) => e.startDate)
    .sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
}

export async function clearContextAwareNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleSuggestions(
  suggestions: Suggestion[],
  expenses: ExpenseItem[]
) {
  const diningTrend = getRecentTrend(expenses, "dining");
  const entertainmentTrend = getRecentTrend(expenses, "entertainment");
  const transportTrend = getRecentTrend(expenses, "transportation");

  // Cache one AI message per event title
  const eventMessageCache: Record<string, string> = {};

  for (const item of suggestions) {
    const eventKey = item.meta?.eventTitle || item.title || "default";

    // Only call AI once per event
    if (!eventMessageCache[eventKey]) {
      const aiMessage = await generateAiReminderMessage({
        eventTitle: item.meta?.eventTitle,
        daysBefore: item.meta?.daysBefore,
        eventType: item.meta?.eventType,
        diningHigh: diningTrend.last7 > diningTrend.prev7 && diningTrend.last7 > 0,
        entertainmentHigh:
          entertainmentTrend.last7 > entertainmentTrend.prev7 &&
          entertainmentTrend.last7 > 0,
        transportHigh:
          transportTrend.last7 > transportTrend.prev7 &&
          transportTrend.last7 > 0,
      });

      eventMessageCache[eventKey] = aiMessage || item.body;

      console.log("Cached AI/fallback message for event:", eventKey);
      console.log("Message used:", eventMessageCache[eventKey]);
    }

    const finalBody = eventMessageCache[eventKey];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body: finalBody,
        sound: true,
        data: { source: "context-aware-expense", meta: item.meta || {} },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.triggerDate,
      },
    });
  }
}

export async function setupContextAwareNotifications(expenses: ExpenseItem[]) {
  const calendarGranted = await requestCalendarPermission();
  const notificationsGranted = await requestNotificationPermission();

  if (!calendarGranted || !notificationsGranted) {
    return {
      success: false,
      message: "Calendar or notification permission was not granted.",
    };
  }

  const events = await getUpcomingEvents(24 * 30);
  const suggestions = buildSuggestions(events, expenses);

  console.log("Built suggestions:", suggestions);

  await clearContextAwareNotifications();
  await scheduleSuggestions(suggestions, expenses);

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log("All scheduled notifications:", scheduled);

  return {
    success: true,
    eventsCount: events.length,
    suggestionsCount: suggestions.length,
  };
}