import { requireStudent } from "@/server/auth/guards";
import { currentChallenge } from "@/server/services/challenge.service";
import { ChallengeView } from "@/components/Challenge";

export const metadata = { title: "Challenge" };

export default async function ChallengePage() {
  const user = await requireStudent();
  return <ChallengeView challenge={await currentChallenge(user.id)} />;
}
