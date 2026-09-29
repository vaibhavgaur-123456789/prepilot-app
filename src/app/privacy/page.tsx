import Link from "next/link";
import { BRAND } from "@/config/brand";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Privacy Policy", description: `How ${BRAND.name} handles your data.` };

const UPDATED = "29 September 2026";

/** Public privacy policy (also required for the Play Store listing). */
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 text-sm leading-relaxed">
      <Link href="/welcome"><Logo size={32} /></Link>
      <h1 className="mt-6 text-2xl font-bold">Privacy Policy</h1>
      <p className="text-muted">Last updated: {UPDATED}</p>

      <h2 className="mt-6 text-lg font-semibold">What we collect</h2>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li><b>Account:</b> your name, email address and a securely hashed password (or your Google sign-in).</li>
        <li><b>Study data you enter:</b> exam and syllabus, study plan, timer sessions, papers you time and the marks you choose to write, attendance, leave days, alarms, notes and reviews.</li>
        <li><b>Messages:</b> questions you ask the AI coach and problems you report to us.</li>
        <li><b>Device:</b> a push-notification token if you turn notifications on, and basic technical logs needed to keep the service secure.</li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">How we use it</h2>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>To build your daily plan, track your study, send the reminders you set and show your progress.</li>
        <li>AI coach questions may be processed by our AI provider (Anthropic) only to answer you.</li>
        <li>Anonymous, grouped statistics (never your name) may be used for benchmarks, only if you keep benchmarking on in your profile.</li>
        <li>We do not sell your data and we do not show third-party ads based on it.</li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Teachers and classes</h2>
      <p className="mt-2">If you join a teacher&apos;s class with a class code, that teacher can see your name, daily study time, days studied, streak and number of papers timed. They cannot see your notes, marks, coach chats, email or other details. You can leave a class anytime from your Profile.</p>

      <h2 className="mt-6 text-lg font-semibold">Where data is stored</h2>
      <p className="mt-2">Data is stored on secure servers in Mumbai, India (Supabase database, Vercel hosting) and sent over encrypted connections (HTTPS).</p>

      <h2 className="mt-6 text-lg font-semibold">Your choices</h2>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>Download all your data or permanently delete your account anytime from Profile → Account.</li>
        <li>Turn notifications and benchmarking on or off in Profile.</li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Children</h2>
      <p className="mt-2">{BRAND.name} is meant for students aged 13 and above. Younger students should use it with a parent or guardian.</p>

      <h2 className="mt-6 text-lg font-semibold">Contact</h2>
      <p className="mt-2">Questions or requests: use the “Report a problem” button in the app. We read every message.</p>
    </main>
  );
}
