import React, { useEffect, useState } from "react";
import { Alert, Switch, View } from "react-native";
import Typo from "@/components/Typo";
import {
  getContextAwareNotificationsEnabled,
  setContextAwareNotificationsEnabled,
} from "@/services/contextAwareNotificationSettings";
import {
  clearContextAwareNotifications,
  setupContextAwareNotifications,
} from "@/services/contextAwareNotificationService";

type Props = {
  expenses: {
    amount: number;
    category?: string;
    date: any;
  }[];
};

const ContextAwareNotificationSetting = ({ expenses }: Props) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const current = await getContextAwareNotificationsEnabled();
      setEnabled(current);
    })();
  }, []);

  const onToggle = async (value: boolean) => {
    try {
      setLoading(true);

      if (value) {
        const result = await setupContextAwareNotifications(expenses);

        if (!result.success) {
          Alert.alert("Permission Required", result.message);
          return;
        }

        await setContextAwareNotificationsEnabled(true);
        setEnabled(true);

        Alert.alert(
          "Enabled",
          `Context-aware notifications are on. ${result.suggestionsCount} reminders scheduled.`
        );
      } else {
        await clearContextAwareNotifications();
        await setContextAwareNotificationsEnabled(false);
        setEnabled(false);

        Alert.alert("Disabled", "Context-aware notifications are off.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to update notification settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Typo size={16}>Context-Aware Notifications</Typo>
        <Typo size={13} color="#9ca3af">
          Get smart expense reminders based on calendar events and recent spending.
        </Typo>
      </View>
      <Switch value={enabled} onValueChange={onToggle} disabled={loading} />
    </View>
  );
};

export default ContextAwareNotificationSetting;