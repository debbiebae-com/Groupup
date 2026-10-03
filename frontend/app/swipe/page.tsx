import { SwipeContainer } from "@/components/swipe/SwipeContainer";
import { TierGate } from "@/components/auth/TierGate";

export default function SwipePage() {
  return (
    <TierGate requiredTier={2}>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Swipe to match</h1>
        <SwipeContainer />
      </div>
    </TierGate>
  );
}