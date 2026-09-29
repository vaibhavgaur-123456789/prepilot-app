import Link from "next/link";
import { getLang } from "@/i18n/server";
import { Card, PageHeader } from "@/components/ui";
import { InstallButton } from "@/components/InstallButton";
import { BRAND } from "@/config/brand";

export const metadata = { title: "Help" };

type Section = { icon: string; title: string; steps: string[]; href?: string };

const EN: Section[] = [
  { icon: "🚀", title: "Getting started", steps: ["Choose what you're studying for: a competitive exam, school/college, self development or a skill.", "Pick your exam from the list, or tap “➕ My exam/goal isn't listed” and type your own subjects, book and chapters.", "Set your daily study time and preferred hours. RozPadh builds a plan every morning."] },
  { icon: "⏱", title: "Timer (punch in / punch out)", steps: ["Sit down to study → tap ⏱ Timer on Home. The stopwatch starts.", "Done → End session → tell us what you actually finished.", "Your time is saved and you earn points (XP). Sessions under 5 minutes earn no points."], href: "/study/session/free?quick=1" },
  { icon: "🗓", title: "Today's plan", steps: ["Plan shows today's blocks with times and why each was chosen.", "Drag to reorder, tap Edit to change, Skip if not today.", "Unfinished work is moved to another day, never deleted."], href: "/plan" },
  { icon: "📚", title: "My syllabus", steps: ["See every chapter and tap the circle: ○ not started → ◐ studying → ✓ done.", "Marking ✓ starts spaced revision (1, 3, 7, 14, 30 days).", "On your own syllabus you can add, rename or delete subjects, books and chapters anytime (new book, cut syllabus, no problem)."], href: "/syllabus" },
  { icon: "📅", title: "Attendance", steps: ["The month calendar shows ✓ studied, ◐ a little, ☾ leave and ✗ missed.", "Taking a day off? Tap the date → Mark leave. Your streak stays safe.", "See total hours and your best day of the month."], href: "/attendance" },
  { icon: "⏰", title: "Alarms", steps: ["Set a study time and days, e.g. 7:00 pm, Mon–Sat.", "Turn on notifications on this device so the alarm reaches your phone.", "Tapping the alarm opens the timer directly."], href: "/alarms" },
  { icon: "📝", title: "Paper timer", steps: ["Keep your printed or PDF paper ready (mock, previous year, sectional). The questions are not in the app.", "Open Paper → set the time (e.g. 60 min) and number of questions → Start paper.", "You get a beep at 10, 5 and 1 minute left. Tap “Section done” after each section to see time per section.", "Finish → optionally write your marks. Your time and score trend are saved."], href: "/tests" },
  { icon: "✨", title: "Shayari & motivation", steps: ["After every study session and paper you get one famous line by a real poet (Kabir, Rahim, Ghalib, Iqbal, the Gita…).", "Open ✨ Shayari to read all of them, see the meaning, save favourites ❤️ and share on WhatsApp."], href: "/shayari" },
  { icon: "💬", title: "AI Coach", steps: ["Ask in Hindi or English: “aaj kya padhu?”, “percentage kaise sudharu?”, “sirf 2 ghante hain”.", "Answers use your own plan, progress and weak topics."], href: "/coach" },
  { icon: "📈", title: "Progress", steps: ["Analytics: planned vs actual, accuracy, weak topics, readiness (an estimate, never a guarantee).", "Weekly report every Monday."], href: "/analytics" },
  { icon: "🏳", title: "Problem or suggestion?", steps: ["Tap the flag 🏳 at the top of any screen and write to us. We read every report."] },
];

const HI: Section[] = [
  { icon: "🚀", title: "शुरुआत", steps: ["चुनें आप किसलिए पढ़ रहे हैं: प्रतियोगी परीक्षा, स्कूल/कॉलेज, सेल्फ डेवलपमेंट या कोई स्किल।", "लिस्ट से अपना एग्ज़ाम चुनें, या “➕ मेरा एग्ज़ाम/लक्ष्य लिस्ट में नहीं है” दबाकर अपने विषय, किताब और चैप्टर खुद लिखें।", "रोज़ का पढ़ाई का समय और पसंदीदा घंटे चुनें। RozPadh हर सुबह प्लान बनाता है।"] },
  { icon: "⏱", title: "टाइमर (पंच इन / पंच आउट)", steps: ["पढ़ने बैठें → होम पर ⏱ टाइमर दबाएँ, स्टॉपवॉच चालू हो जाएगी।", "पढ़ाई खत्म → सेशन खत्म करें → बताएँ असल में क्या पूरा किया।", "आपका समय सेव होता है और अंक (XP) मिलते हैं। 5 मिनट से छोटे सेशन पर अंक नहीं मिलते।"], href: "/study/session/free?quick=1" },
  { icon: "🗓", title: "आज का प्लान", steps: ["प्लान में आज के काम, समय और हर काम का कारण दिखता है।", "खींचकर क्रम बदलें, बदलें से समय बदलें, आज नहीं करना तो छोड़ें।", "अधूरा काम दूसरे दिन चला जाता है, कभी मिटता नहीं।"], href: "/plan" },
  { icon: "📚", title: "मेरा सिलेबस", steps: ["हर चैप्टर के गोले पर टैप करें: ○ शुरू नहीं → ◐ पढ़ रहे हैं → ✓ पूरा।", "✓ करते ही रिवीज़न शुरू (1, 3, 7, 14, 30 दिन बाद)।", "अपने सिलेबस में कभी भी विषय, किताब और चैप्टर जोड़ें, बदलें या हटाएँ। किताब बदली या सिलेबस कटा, कोई दिक्कत नहीं।"], href: "/syllabus" },
  { icon: "📅", title: "हाज़िरी", steps: ["महीने के कैलेंडर में ✓ पढ़ा, ◐ थोड़ा, ☾ छुट्टी, ✗ नहीं पढ़ा दिखता है।", "छुट्टी लेनी है? तारीख पर टैप करें → छुट्टी मार्क करें। स्ट्रीक नहीं टूटेगी।", "महीने के कुल घंटे और सबसे अच्छा दिन देखें।"], href: "/attendance" },
  { icon: "⏰", title: "अलार्म", steps: ["पढ़ाई का समय और दिन चुनें, जैसे शाम 7:00, सोम–शनि।", "इस डिवाइस पर सूचनाएँ चालू करें ताकि अलार्म फ़ोन पर आए।", "अलार्म पर टैप करते ही टाइमर खुल जाता है।"], href: "/alarms" },
  { icon: "📝", title: "पेपर टाइमर", steps: ["अपना छपा हुआ या PDF पेपर तैयार रखें (मॉक, पिछले साल का, सेक्शनल)। प्रश्न ऐप में नहीं होते।", "पेपर खोलें → समय (जैसे 60 मिनट) और प्रश्नों की संख्या डालें → पेपर शुरू करें।", "10, 5 और 1 मिनट बचने पर बीप होगी। हर सेक्शन के बाद “सेक्शन पूरा” दबाएँ, हर सेक्शन का समय दिखेगा।", "खत्म करें → चाहें तो अपने अंक लिखें। आपका समय और स्कोर का रुझान सेव रहता है।"], href: "/tests" },
  { icon: "✨", title: "शायरी और प्रेरणा", steps: ["हर पढ़ाई सेशन और पेपर के बाद किसी असली कवि (कबीर, रहीम, ग़ालिब, इक़बाल, गीता…) की एक मशहूर पंक्ति आती है।", "✨ शायरी खोलकर सारी पंक्तियाँ पढ़ें, मतलब देखें, पसंदीदा ❤️ सेव करें और WhatsApp पर शेयर करें।"], href: "/shayari" },
  { icon: "💬", title: "AI कोच", steps: ["हिंदी या अंग्रेज़ी में पूछें: “आज क्या पढ़ूँ?”, “percentage कैसे सुधारूँ?”, “सिर्फ 2 घंटे हैं”।", "जवाब आपके प्लान, प्रगति और कमज़ोर टॉपिक से आते हैं।"], href: "/coach" },
  { icon: "📈", title: "प्रगति", steps: ["विश्लेषण: तय बनाम असल, सटीकता, कमज़ोर टॉपिक, तैयारी स्कोर (यह अनुमान है, गारंटी नहीं)।", "हर सोमवार साप्ताहिक रिपोर्ट।"], href: "/analytics" },
  { icon: "🏳", title: "कोई समस्या या सुझाव?", steps: ["किसी भी स्क्रीन पर ऊपर 🏳 झंडा दबाएँ और लिखें। हम हर शिकायत पढ़ते हैं।"] },
];

export default async function HelpPage() {
  const lang = await getLang();
  const sections = lang === "hi" ? HI : EN;
  return (
    <div className="space-y-4">
      <PageHeader title={lang === "hi" ? "मदद: ऐप कैसे इस्तेमाल करें" : "Help: how to use RozPadh"} subtitle={lang === "hi" ? "ऊपर EN | हिं से भाषा बदलें" : "Switch language with EN | हिं at the top"} />
      <Card>
        <p className="mb-2 font-semibold">📲 {lang === "hi" ? "फ़ोन पर ऐप की तरह इंस्टॉल करें" : "Install on your phone like an app"}</p>
        <InstallButton />
      </Card>
      {sections.map((s) => (
        <Card key={s.title}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold"><span aria-hidden>{s.icon}</span> {s.title}</h2>
            {s.href && <Link href={s.href} className="text-sm font-semibold text-primary">{lang === "hi" ? "खोलें →" : "Open →"}</Link>}
          </div>
          <ol className="list-inside list-decimal space-y-1.5 text-sm">{s.steps.map((x) => <li key={x}>{x}</li>)}</ol>
        </Card>
      ))}
      <Card className="flex items-center gap-4">
        {BRAND.developer.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={BRAND.developer.photo} alt={BRAND.developer.name} width={72} height={72} className="h-[72px] w-[72px] shrink-0 rounded-full object-cover shadow-brand" />
        ) : (
          <span className="bg-grad shadow-brand grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full text-2xl font-extrabold text-white" aria-hidden>{BRAND.developer.initials}</span>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hi" ? "डेवलपर" : "Developer"}</p>
          <p className="text-lg font-bold">{BRAND.developer.name}</p>
          <p className="text-sm text-muted">{lang === "hi" ? `${BRAND.name} को भारत के विद्यार्थियों के लिए प्यार से बनाया।` : `Made ${BRAND.name} with love for students in India.`}</p>
        </div>
      </Card>
    </div>
  );
}
