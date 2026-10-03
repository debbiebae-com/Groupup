import { TierGate } from "@/components/auth/TierGate";
import { SwipeContainer } from "@/components/swipe/SwipeContainer";

export default function SwipePage() {
  return (
    <TierGate requiredTier={2}>
      <SwipeContainer />
    </TierGate>
  );
}
