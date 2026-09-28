import { redirect } from "next/navigation";

/** Old in-app test links (/tests/start, /tests/attempt, /tests/result) now open the Paper timer. */
export default function OldTestLink() {
  redirect("/tests");
}
