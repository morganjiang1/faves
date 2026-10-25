import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useEffect } from "react";
import { startChat } from "@/chat/store";
import { TabBar } from "@/components/TabBar";
import { useStore } from "@/state/store";

export default function TabsLayout() {
  const onboarded = useStore((s) => s.profile.onboarded);
  useEffect(() => { if (onboarded) startChat(); }, [onboarded]);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
