// An invite link (faves://join/<code> or <site>/join/<code>): join the group and open it.
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { chat, startChat } from "@/chat/store";
import { EmptyState, LoadingPill } from "@/components/ui";
import { useStore } from "@/state/store";
import { palette } from "@/theme/tokens";

export default function Join() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const onboarded = useStore((s) => s.profile.onboarded);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!onboarded) { router.replace(`/onboarding?next=${encodeURIComponent(`/join/${code}`)}`); return; }
    let live = true;
    (async () => {
      setFailed(false);
      await startChat();
      // The relay may still be connecting: give it a few tries.
      for (let i = 0; i < 6 && live; i++) {
        const g = await chat.join(String(code));
        if (g) { router.replace(`/chat/${g.id}`); return; }
        await new Promise((r) => setTimeout(r, 700));
      }
      if (live) setFailed(true);
    })();
    return () => { live = false; };
  }, [code, onboarded, attempt]);

  return (
    <View style={styles.screen} testID="join-screen">
      {failed ? (
        <EmptyState testID="join-failed" icon="ticket-outline" title="Couldn't join" body={`No group with the code ${String(code).toUpperCase()} answered. Check you're online, or ask for a new link.`} cta="Try again" onCta={() => setAttempt((a) => a + 1)} secondary="Go to chats" onSecondary={() => router.replace("/chats")} />
      ) : <LoadingPill text={`Joining ${String(code).toUpperCase()}`} />}
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: "center", backgroundColor: palette.paper } });
