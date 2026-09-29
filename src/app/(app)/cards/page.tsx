import { requireStudent } from "@/server/auth/guards";
import { cardOverview, listCards } from "@/server/services/flashcard.service";
import { CardsApp } from "@/components/Cards";

export const metadata = { title: "Flashcards" };

export default async function CardsPage() {
  const user = await requireStudent();
  const [o, all] = await Promise.all([cardOverview(user.id), listCards(user.id)]);
  return <CardsApp due={o.due} total={o.total} decks={o.decks} all={all} />;
}
