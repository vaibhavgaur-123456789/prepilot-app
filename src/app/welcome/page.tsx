import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { getLang } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth/guards";
import { LanguageSwitch } from "@/i18n/client";
import { InstallButton } from "@/components/InstallButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name}: Free study planner, focus timer & attendance for SSC, Railway, Banking and boards` },
  alternates: { canonical: "/welcome" },
};

const COPY = {
  en: {
    badge: "Free · Hindi & English · Works as an app",
    h1a: "Your study plan, timer and attendance",
    h1b: "all in one app",
    sub: "RozPadh tells you what to study today, times your study, keeps your attendance and reminds you on time. For SSC, Railway, Banking, state exams, school boards or your own syllabus.",
    start: "Start free", login: "I have an account", open: "Open my dashboard",
    featuresTitle: "Everything a serious student needs",
    features: [
      ["⏱", "One-tap study timer", "Tap when you sit to study, tap when you stop. Your time is saved and you earn points."],
      ["🗓", "Plan for today", "A daily plan from your syllabus, time and weak topics, with the reason for every task."],
      ["📅", "Attendance calendar", "See every day of the month: studied, a little, leave or missed. Leave days don't break your streak."],
      ["⏰", "Study alarms", "Set your study time and days, and get a reminder on your phone."],
      ["📚", "Your own syllabus", "Exam not listed? Add your own subjects, book and chapters, and change them anytime."],
      ["🔁", "Smart revision", "Finished chapters come back for revision after 1, 3, 7, 14 and 30 days."],
      ["📝", "Paper timer", "Solve mocks and previous year papers on paper with exam-style time, section splits and a score trend."],
      ["✨", "Shayari after every session", "Famous lines by Kabir, Rahim, Ghalib, Iqbal, the Gita and more keep you going."],
      ["💬", "Coach in Hindi", "Ask “aaj kya padhu?” or “percentage kaise sudharu?” and get answers from your own data."],
    ],
    howTitle: "How it works",
    how: [["1", "Sign up free", "Choose your exam, or create your own syllabus in 2 minutes."], ["2", "Study with the timer", "Follow today's plan and tap ⏱ when you sit to study."], ["3", "Watch yourself improve", "Attendance, streaks, weak topics and weekly reports show your progress."]],
    examsTitle: "Ready syllabus for",
    exams: ["SSC CGL Tier 1", "RRB NTPC CBT 1", "IBPS PO Prelims"],
    examsMore: "Preparing for something else (UP Police, CUET, NEET, Class 10/12, a skill)? Create your own syllabus with your book and chapters.",
    faqTitle: "Questions",
    faq: [
      ["Is RozPadh free?", "Yes. The planner, timer, paper timer, attendance, alarms, revision and shayari are free."],
      ["How do I download the app?", "Open the site in Chrome (Android) or Safari (iPhone) and tap “Install app” or “Add to Home Screen”. It installs like a normal app, with its own icon and notifications."],
      ["Does it work in Hindi?", "Yes. Switch between English and हिंदी with the EN | हिं button at any time."],
      ["My exam isn't in the list. Can I still use it?", "Yes. Choose “My exam/goal isn't listed” and type your own subjects, book and chapters."],
      ["Does the readiness score predict selection?", "No. It is an honest estimate of your preparation from your own data, never a guarantee of selection."],
    ],
    ctaTitle: "Start today. It takes 2 minutes.",
    footer: "Made for students in India",
  },
  hi: {
    badge: "मुफ़्त · हिंदी और English · ऐप की तरह चलता है",
    h1a: "पढ़ाई का प्लान, टाइमर और हाज़िरी",
    h1b: "सब एक ही ऐप में",
    sub: "RozPadh बताता है आज क्या पढ़ना है, पढ़ाई का समय नापता है, हाज़िरी रखता है और समय पर याद दिलाता है। SSC, Railway, Banking, राज्य परीक्षा, स्कूल बोर्ड या आपका अपना सिलेबस।",
    start: "मुफ़्त शुरू करें", login: "मेरा खाता है", open: "मेरा डैशबोर्ड खोलें",
    featuresTitle: "एक गंभीर छात्र को जो चाहिए, सब कुछ",
    features: [
      ["⏱", "एक टैप टाइमर", "पढ़ने बैठें तो दबाएँ, उठें तो बंद करें। समय सेव होता है और अंक मिलते हैं।"],
      ["🗓", "आज का प्लान", "आपके सिलेबस, समय और कमज़ोर टॉपिक से रोज़ का प्लान, हर काम के कारण के साथ।"],
      ["📅", "हाज़िरी कैलेंडर", "महीने का हर दिन: पढ़ा, थोड़ा, छुट्टी या छूटा। छुट्टी से स्ट्रीक नहीं टूटती।"],
      ["⏰", "पढ़ाई का अलार्म", "अपना समय और दिन चुनें, फ़ोन पर याद दिलाया जाएगा।"],
      ["📚", "अपना सिलेबस", "एग्ज़ाम लिस्ट में नहीं? अपने विषय, किताब और चैप्टर खुद जोड़ें, कभी भी बदलें।"],
      ["🔁", "स्मार्ट रिवीज़न", "पूरे चैप्टर 1, 3, 7, 14 और 30 दिन बाद रिवीज़न के लिए लौटते हैं।"],
      ["📝", "पेपर टाइमर", "मॉक और पिछले साल के पेपर कागज़ पर हल करें, परीक्षा जैसा समय, सेक्शन का समय और स्कोर का रुझान।"],
      ["✨", "हर सेशन के बाद शायरी", "कबीर, रहीम, ग़ालिब, इक़बाल, गीता और भी की मशहूर पंक्तियाँ आपको प्रेरित रखती हैं।"],
      ["💬", "हिंदी में कोच", "पूछें “आज क्या पढ़ूँ?” या “percentage कैसे सुधारूँ?” और अपने डेटा से जवाब पाएँ।"],
    ],
    howTitle: "कैसे काम करता है",
    how: [["1", "मुफ़्त साइन अप", "अपना एग्ज़ाम चुनें या 2 मिनट में अपना सिलेबस बनाएँ।"], ["2", "टाइमर से पढ़ें", "आज का प्लान देखें और पढ़ने बैठें तो ⏱ दबाएँ।"], ["3", "अपनी प्रगति देखें", "हाज़िरी, स्ट्रीक, कमज़ोर टॉपिक और साप्ताहिक रिपोर्ट।"]],
    examsTitle: "तैयार सिलेबस",
    exams: ["SSC CGL Tier 1", "RRB NTPC CBT 1", "IBPS PO Prelims"],
    examsMore: "किसी और चीज़ की तैयारी (UP Police, CUET, NEET, 10वीं/12वीं, कोई स्किल)? अपनी किताब और चैप्टर से अपना सिलेबस बनाएँ।",
    faqTitle: "सवाल-जवाब",
    faq: [
      ["क्या RozPadh मुफ़्त है?", "हाँ। प्लानर, टाइमर, पेपर टाइमर, हाज़िरी, अलार्म, रिवीज़न और शायरी मुफ़्त हैं।"],
      ["ऐप कैसे डाउनलोड करें?", "Android पर Chrome या iPhone पर Safari में साइट खोलें और “Install app” या “Add to Home Screen” दबाएँ। यह आम ऐप की तरह, अपने आइकन और सूचनाओं के साथ इंस्टॉल होता है।"],
      ["क्या यह हिंदी में चलता है?", "हाँ। EN | हिं बटन से कभी भी भाषा बदलें।"],
      ["मेरा एग्ज़ाम लिस्ट में नहीं है, क्या फिर भी इस्तेमाल कर सकता हूँ?", "हाँ। “मेरा एग्ज़ाम/लक्ष्य लिस्ट में नहीं है” चुनें और अपने विषय, किताब और चैप्टर लिखें।"],
      ["क्या तैयारी स्कोर चयन की भविष्यवाणी करता है?", "नहीं। यह आपके डेटा से तैयारी का ईमानदार अनुमान है, चयन की गारंटी कभी नहीं।"],
    ],
    ctaTitle: "आज से शुरू करें। सिर्फ 2 मिनट लगते हैं।",
    footer: "भारत के छात्रों के लिए बनाया गया",
  },
} as const;

export default async function WelcomePage() {
  const [lang, user] = await Promise.all([getLang(), getCurrentUser().catch(() => null)]);
  const c = COPY[lang];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: BRAND.name,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Android, iOS, Windows, macOS (web app)",
      inLanguage: ["en-IN", "hi-IN"],
      description: COPY.en.sub,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <main className="min-h-dvh overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/welcome" className="flex items-center gap-2 font-bold">
            <LogoMark size={34} />
            {BRAND.name}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitch signedIn={!!user} />
            {!user && <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-soft sm:inline-flex">{c.login}</Link>}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="bg-grad pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-[0.08] [clip-path:ellipse(80%_100%_at_50%_0%)]" aria-hidden />
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 pb-10 pt-12 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
          <div className="stagger">
            <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">{c.badge}</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {c.h1a} <span className="text-grad">{c.h1b}</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">{c.sub}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {user ? (
                <Link href="/" className="press bg-grad shadow-brand inline-flex min-h-12 items-center rounded-xl px-6 text-base font-bold">{c.open} →</Link>
              ) : (
                <>
                  <Link href="/signup" className="press bg-grad shadow-brand inline-flex min-h-12 items-center rounded-xl px-6 text-base font-bold">{c.start} →</Link>
                  <Link href="/login" className="press inline-flex min-h-12 items-center rounded-xl border border-border bg-surface px-5 text-base font-semibold">{c.login}</Link>
                </>
              )}
            </div>
            <div className="mt-4"><InstallButton /></div>
          </div>

          {/* Phone mock-up built from real UI pieces */}
          <div className="animate-float mx-auto w-full max-w-[300px]" aria-hidden>
            <div className="rounded-[2.2rem] border-8 border-[#141b33] bg-bg p-3 shadow-brand">
              <div className="bg-grad rounded-2xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">{lang === "hi" ? "अगला काम" : "Next action"}</p>
                <p className="mt-1 text-sm font-bold">{lang === "hi" ? "गणित: प्रतिशत" : "Maths: Percentage"}</p>
                <p className="mt-1 text-xs text-white/85">⏱ 45 {lang === "hi" ? "मिनट" : "min"} · 20 {lang === "hi" ? "प्रश्न" : "questions"}</p>
                <div className="mt-3 rounded-lg bg-white py-2 text-center text-xs font-bold text-[#3b55e6]">▶ {lang === "hi" ? "पढ़ाई शुरू करें" : "Start study"}</div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[9px] font-semibold">
                {["⏱", "📅", "⏰", "📚"].map((i) => <div key={i} className="rounded-xl border border-border bg-surface py-2 text-base">{i}</div>)}
              </div>
              <div className="mt-3 rounded-xl border border-border bg-surface p-3">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 21 }).map((_, i) => (
                    <div key={i} className={`aspect-square rounded ${[3, 10, 17].includes(i) ? "bg-primary-soft" : i % 6 === 5 ? "bg-danger-soft" : "bg-success-soft"}`} />
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface p-3">
                <span className="bg-grad-warm animate-flame grid h-8 w-8 place-items-center rounded-lg text-sm">🔥</span>
                <div className="text-xs"><b className="text-text">12 {lang === "hi" ? "दिन लगातार" : "day streak"}</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{c.featuresTitle}</h2>
        <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.features.map(([icon, title, text]) => (
            <article key={title} className="lift rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-2xl" aria-hidden>{icon}</div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{c.howTitle}</h2>
        <ol className="stagger mt-8 grid gap-4 sm:grid-cols-3">
          {c.how.map(([n, title, text]) => (
            <li key={n} className="rounded-2xl border border-border bg-surface p-5">
              <span className="bg-grad grid h-10 w-10 place-items-center rounded-full text-lg font-bold">{n}</span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Exams */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-surface p-6 text-center sm:p-10">
          <h2 className="text-2xl font-bold">{c.examsTitle}</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {c.exams.map((e) => <span key={e} className="rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary">{e}</span>)}
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted">{c.examsMore}</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{c.faqTitle}</h2>
        <div className="mt-6 space-y-3">
          {c.faq.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-border bg-surface p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                {q}
                <span className="text-primary transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-14 pt-4">
        <div className="bg-grad shadow-brand relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
          <div className="animate-float pointer-events-none absolute -left-8 -top-8 h-36 w-36 rounded-full bg-white/10" aria-hidden />
          <h2 className="relative text-2xl font-extrabold sm:text-3xl">{c.ctaTitle}</h2>
          <Link href={user ? "/" : "/signup"} className="press relative mt-6 inline-flex min-h-12 items-center rounded-xl bg-white px-7 text-base font-bold text-[#3b55e6]">{user ? c.open : c.start} →</Link>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        <p>© {new Date().getFullYear()} {BRAND.name} · {c.footer}</p>
        <div className="mt-2"><FeedbackButton signedIn={!!user} variant="link" /></div>
      </footer>
    </main>
  );
}
