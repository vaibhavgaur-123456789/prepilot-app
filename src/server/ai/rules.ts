import { formatMinutes } from "@/lib/engine/dates";
import { MISTAKE_FIXES } from "@/lib/engine/mistakes";
import { PATHWAY } from "@/lib/engine/weakness";
import type { CoachContext } from "./context";

export type Intent =
  | "TODAY" | "MISSED" | "LIMITED_TIME" | "SUBJECT_FALLING" | "WHY_WRONG" | "REVISION_PLAN" | "LAST_MOCK" | "READINESS"
  | "TOPIC" | "MOTIVATION" | "PROGRESS" | "TIMETABLE" | "HOW_TO" | "GREETING" | "GENERAL";
export type CoachLang = "en" | "hi";

const HINGLISH = /\b(kya|kaise|kaisa|kab|kitna|kitne|mera|meri|mere|mujhe|muje|hai|hain|nahi|nhi|padh|padhu|padhna|padhai|karu|karun|kar|batao|bataiye|aaj|kal|kyu|kyun|acha|accha|samajh|yaad|sirf|ghante|ghanta)\b/i;

/** Answer in Hindi if the student writes in Devanagari or Hinglish, or uses the Hindi interface. */
export function detectLang(text: string, uiLang?: string | null): CoachLang {
  if (/[ऀ-ॿ]/.test(text) || HINGLISH.test(text)) return "hi";
  return uiLang === "hi" ? "hi" : "en";
}

export function detectIntent(text: string): { intent: Intent; hours?: number } {
  const t = text.toLowerCase();
  const hours = t.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b|ghante|ghanta|घंटे|घंटा)/);
  if (hours) return { intent: "LIMITED_TIME", hours: Number(hours[1]) };
  const mins = t.match(/(\d+)\s*(?:min|minutes|मिनट)/);
  if (mins && /only|sirf|bas|सिर्फ|बस|have|hai|है/.test(t)) return { intent: "LIMITED_TIME", hours: Number(mins[1]) / 60 };
  if (/app kaise|kaise use|how (do i|to) use|help|madad|मदद|इस्तेमाल/.test(t)) return { intent: "HOW_TO" };
  if (/miss|skipped|couldn'?t study|didn'?t study|nahi padh|nhi padh|chhut|छूट|नहीं पढ़/.test(t)) return { intent: "MISSED" };
  if (/mock|test result|last test|analy[sz]e|मॉक|टेस्ट/.test(t)) return { intent: "LAST_MOCK" };
  if (/why .*wrong|getting .*wrong|mistake|galat|galti|गलत|गलती/.test(t)) return { intent: "WHY_WRONG" };
  if (/revis|dohra|रिवीज़न|रिवीजन|दोहरा/.test(t)) return { intent: "REVISION_PLAN" };
  if (/falling|dropping|declin|worse|gir|kam ho|गिर|कम हो/.test(t)) return { intent: "SUBJECT_FALLING" };
  if (/ready|readiness|chance|selection|clear the exam|taiyari kitni|तैयारी कितनी|चयन/.test(t)) return { intent: "READINESS" };
  if (/motivat|bore|thak|tired|stress|tension|dar |darr|neend|sleep|lazy|aalas|focus nahi|man nahi|mann nahi|mood|don'?t feel like|phone|mobile|उदास|थक|नींद|डर|फोन|आलस|मन नहीं/.test(t)) return { intent: "MOTIVATION" };
  if (/streak|xp|points?|level|progress|kitna padha|hazri|attendance|प्रगति|अंक|हाज़िरी|हाजिरी/.test(t)) return { intent: "PROGRESS" };
  if (/timetable|time table|schedule|routine|din ka plan|dincharya|समय सारणी|रूटीन/.test(t)) return { intent: "TIMETABLE" };
  if (/today|study now|what should i|aaj|kya padh|आज|क्या पढ़/.test(t)) return { intent: "TODAY" };
  if (/^(hi|hello|hey|namaste|namaskar|नमस्ते|हेलो)\b/.test(t.trim())) return { intent: "GREETING" };
  return { intent: "GENERAL" };
}

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${Math.round(v * (v <= 1 ? 100 : 1))}%`);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** Find a chapter or subject the student mentioned by name. */
function findTopic(text: string, c: CoachContext) {
  const t = text.toLowerCase();
  const byLen = [...c.topics].sort((a, b) => b.name.length - a.name.length);
  return byLen.find((x) => {
    const n = x.name.toLowerCase().replace(/^[^:]+:\s*/, "");
    return n.length >= 4 && t.includes(n.split(/[\s&(]/)[0]) && (t.includes(n) || n.split(/\s+/).filter((w) => w.length > 3).every((w) => t.includes(w)));
  });
}

/** Deterministic, data-driven answers in Hindi or English. Used when no LLM is configured or it fails. */
export function ruleBasedAnswer(text: string, c: CoachContext, uiLang?: string | null): { intent: Intent; answer: string } {
  const L = detectLang(text, uiLang ?? c.language);
  const H = L === "hi";
  const S = (en: string, hi: string) => (H ? hi : en);
  let { intent } = detectIntent(text);
  const { hours } = detectIntent(text);
  const topic = findTopic(text, c);
  if (topic && (intent === "GENERAL" || intent === "WHY_WRONG" || intent === "TODAY")) intent = "TOPIC";
  const lines: string[] = [];
  const top = c.priorities.slice(0, 3);

  switch (intent) {
    case "GREETING": {
      lines.push(S(`Hi ${c.student.name}! ${c.student.daysLeft} days to ${c.student.exam}.`, `नमस्ते ${c.student.name}! ${c.student.exam} में ${c.student.daysLeft} दिन बाकी हैं।`));
      lines.push(S(`Today you've studied ${formatMinutes(c.progress.todayMinutes)}. Streak: ${c.progress.streak} days.`, `आज आपने ${formatMinutes(c.progress.todayMinutes)} पढ़ाई की है। लगातार ${c.progress.streak} दिन।`));
      lines.push(S("Ask me what to study, how to fix a weak topic, or how your last test went.", "पूछिए: आज क्या पढ़ूँ, कोई कमज़ोर टॉपिक कैसे सुधारूँ, या पिछला टेस्ट कैसा रहा।"));
      break;
    }
    case "TODAY": {
      const open = c.today.tasks.filter((t) => t.status !== "DONE" && t.status !== "SKIPPED");
      if (open.length === 0) lines.push(S("Today's plan is complete. If you have energy left, a 20-minute revision of a due topic is the best use of it.", "आज का प्लान पूरा हो गया है। ऊर्जा बाकी है तो किसी बाकी टॉपिक का 20 मिनट रिवीज़न सबसे अच्छा रहेगा।"));
      else {
        lines.push(S(`You have ${open.length} block${open.length === 1 ? "" : "s"} left today (${formatMinutes(open.reduce((s, t) => s + t.minutes, 0))}). Start with:`, `आज ${open.length} काम बाकी हैं (${formatMinutes(open.reduce((s, t) => s + t.minutes, 0))})। पहले ये करें:`));
        open.slice(0, 3).forEach((t, i) => lines.push(`${i + 1}. ${t.title} (${t.minutes} ${S("min", "मिनट")})${t.reasons.length ? ` · ${t.reasons[0]}` : ""}`));
      }
      if (c.revisionsDue.length) lines.push(S(`Also due: revision of ${c.revisionsDue.slice(0, 3).map((r) => r.topic).join(", ")}.`, `रिवीज़न भी बाकी है: ${c.revisionsDue.slice(0, 3).map((r) => r.topic).join(", ")}।`));
      lines.push(S("Tap ⏱ Timer on Home when you sit down to study.", "पढ़ने बैठें तो होम पर ⏱ टाइमर दबाएँ।"));
      break;
    }
    case "TOPIC": {
      const tp = topic!;
      lines.push(`📘 ${tp.subject}: ${tp.name}`);
      if (tp.attempts > 0) lines.push(S(`Accuracy ${pct(tp.accuracy)} over ${tp.attempts} questions, ${formatMinutes(tp.minutes)} studied.`, `${tp.attempts} प्रश्नों में सटीकता ${pct(tp.accuracy)}, ${formatMinutes(tp.minutes)} पढ़ाई की।`));
      else lines.push(S(`No practice recorded yet (${formatMinutes(tp.minutes)} studied). Status: ${tp.status.toLowerCase().replace("_", " ")}.`, `अभी कोई अभ्यास दर्ज नहीं है (${formatMinutes(tp.minutes)} पढ़ाई)।`));
      if (tp.weak || (tp.accuracy !== null && tp.accuracy < 0.65)) {
        lines.push(S("It's a weak topic. Recover it in 5 steps:", "यह कमज़ोर टॉपिक है। 5 कदमों में सुधारें:"));
        const hiSteps = ["कॉन्सेप्ट दोबारा पढ़ें + 5 हल किए उदाहरण", "15 आसान प्रश्न (80%+ सही)", "15 मध्यम प्रश्न, हर एक का तरीका लिखें", "20 प्रश्न समय के साथ (~90 सेकंड/प्रश्न)", "15 प्रश्नों का री-टेस्ट (75%+ = सुधार पक्का)"];
        PATHWAY.forEach((p, i) => lines.push(`${i + 1 === tp.step ? "▶" : `${i + 1}.`} ${H ? hiSteps[i] : `${p.name}: ${p.objective(tp.name, p.questions)}`}`));
      } else if (tp.status === "COMPLETED") {
        lines.push(S(`Looks solid. Keep it fresh with spaced revision${tp.revisionOn ? ` (next on ${tp.revisionOn})` : ""} and 10 mixed questions a week.`, `अच्छी स्थिति है। रिवीज़न करते रहें${tp.revisionOn ? ` (अगला ${tp.revisionOn} को)` : ""} और हफ़्ते में 10 मिले-जुले प्रश्न हल करें।`));
      } else {
        lines.push(S("Plan: 45 min concept + worked examples → 20 practice questions → mark it done in My syllabus to start revision.", "प्लान: 45 मिनट कॉन्सेप्ट + उदाहरण → 20 अभ्यास प्रश्न → फिर 'मेरा सिलेबस' में पूरा मार्क करें ताकि रिवीज़न शुरू हो।"));
      }
      break;
    }
    case "MISSED": {
      const missed = c.last7Days.filter((d) => d.planned > 0 && d.actual < d.planned * 0.5).length;
      lines.push(S("Missing a day doesn't undo your preparation. Your unfinished work was re-scheduled, reduced or merged, and nothing was silently dropped.", "एक दिन छूटने से तैयारी खत्म नहीं होती। अधूरा काम आगे खिसका दिया गया है, कुछ भी चुपचाप हटाया नहीं गया।"));
      if (missed >= 3) lines.push(S(`${missed} of the last 7 days were below half the plan, so recovery mode may give you a smaller, high-value plan.`, `पिछले 7 में से ${missed} दिन आधे से कम काम हुआ, इसलिए रिकवरी मोड छोटा और ज़रूरी प्लान देगा।`));
      if (top[0]) lines.push(S(`Restart with one focused block: ${top[0].topic}.`, `एक फ़ोकस ब्लॉक से दोबारा शुरू करें: ${top[0].topic}।`));
      lines.push(S("Planned a day off? Mark it as leave in 📅 Attendance so your streak stays safe.", "छुट्टी ली थी? 📅 हाज़िरी में उस दिन को छुट्टी मार्क करें, स्ट्रीक सुरक्षित रहेगी।"));
      break;
    }
    case "LIMITED_TIME": {
      const minsTotal = Math.max(15, Math.round((hours ?? 2) * 60));
      lines.push(S(`With ${formatMinutes(minsTotal)} today, here's the highest-value split:`, `आज ${formatMinutes(minsTotal)} हैं, तो ऐसे बाँटें:`));
      let left = minsTotal;
      let revised: string | null = null;
      if (c.revisionsDue.length && left >= 40) {
        revised = c.revisionsDue[0].topic;
        lines.push(`• 20 ${S("min", "मिनट")}: ${S("revise", "रिवीज़न")} ${revised}`);
        left -= 20;
      }
      for (const p of c.priorities.filter((x) => !revised || !x.topic.endsWith(`: ${revised}`)).slice(0, 3)) {
        if (left < 15) break;
        const m = Math.min(left, 45);
        lines.push(`• ${m} ${S("min", "मिनट")}: ${p.topic}${p.reasons[0] ? ` (${p.reasons[0]})` : ""}`);
        left -= m;
      }
      lines.push(S("Adjust today's plan in Plan → Re-plan.", "प्लान → दोबारा प्लान से आज का प्लान बदलें।"));
      break;
    }
    case "SUBJECT_FALLING": {
      const falling = c.subjects.filter((s) => s.recentAccuracy !== null && s.previousAccuracy !== null && s.recentAccuracy < s.previousAccuracy).sort((a, b) => (a.recentAccuracy! - a.previousAccuracy!) - (b.recentAccuracy! - b.previousAccuracy!));
      if (!falling.length) lines.push(S("I don't see a measurable decline in any subject yet. Keep practising so the trend has enough data.", "अभी किसी विषय में गिरावट नहीं दिख रही। अभ्यास जारी रखें ताकि रुझान साफ़ दिखे।"));
      else {
        const f = falling[0];
        lines.push(S(`${f.name} accuracy moved from ${f.previousAccuracy}% to ${f.recentAccuracy}% over the last two weeks.`, `${f.name} की सटीकता पिछले दो हफ़्तों में ${f.previousAccuracy}% से ${f.recentAccuracy}% हो गई।`));
        const weakIn = c.weakTopics.filter((w) => w.subject === f.name);
        if (weakIn.length) lines.push(S(`Main reasons: ${weakIn.map((w) => `${w.topic} (${pct(w.accuracy)})`).join(", ")}.`, `मुख्य कारण: ${weakIn.map((w) => `${w.topic} (${pct(w.accuracy)})`).join(", ")}।`));
        lines.push(S("Fix: concept recap → easy → medium → timed → re-test. These are already in your plan.", "सुधार: कॉन्सेप्ट → आसान → मध्यम → समय के साथ → री-टेस्ट। ये आपके प्लान में जुड़े हैं।"));
      }
      break;
    }
    case "WHY_WRONG": {
      const m = c.mistakes;
      if (!m.open) lines.push(S("Your mistake book is empty. Take a test so I can see patterns.", "आपकी गलतियों की कॉपी खाली है। कोई टेस्ट दें ताकि पैटर्न दिखे।"));
      else {
        if (m.top) lines.push(S(m.top.message, `आपकी सबसे आम गलती: ${m.top.category.toLowerCase().replace("_", " ")} (${m.top.count} बार)।`), S(`Fix: ${m.top.fix}`, "सुधार: हर प्रश्न का आखिरी हिस्सा दोबारा पढ़ें, हिसाब जाँचें, और 90 सेकंड से ज़्यादा लगे तो छोड़कर आगे बढ़ें।"));
        if (m.byTopic.length) lines.push(S(`Most mistakes: ${m.byTopic.slice(0, 3).map(([t, n]) => `${t} (${n})`).join(", ")}.`, `सबसे ज़्यादा गलतियाँ: ${m.byTopic.slice(0, 3).map(([t, n]) => `${t} (${n})`).join(", ")}।`));
      }
      break;
    }
    case "REVISION_PLAN": {
      if (!c.revisionsDue.length) lines.push(S("No revisions are due today. Your 1-3-7-14-30 day schedule is up to date.", "आज कोई रिवीज़न बाकी नहीं है। 1-3-7-14-30 दिन वाला शेड्यूल ठीक चल रहा है।"));
      else {
        lines.push(S(`${c.revisionsDue.length} revision(s) due, most overdue first (about 20 min each):`, `${c.revisionsDue.length} रिवीज़न बाकी हैं, पहले सबसे पुराने (हर एक ~20 मिनट):`));
        c.revisionsDue.slice(0, 6).forEach((r, i) => lines.push(`${i + 1}. ${r.topic}${r.overdueDays ? ` (${r.overdueDays} ${S("days late", "दिन देर")})` : ""}`));
      }
      break;
    }
    case "LAST_MOCK": {
      const m = c.lastMock;
      if (!m) lines.push(S("You haven't submitted a test yet. Take one from the Tests tab and I'll analyse it here.", "आपने अभी कोई टेस्ट नहीं दिया। टेस्ट टैब से एक दें, फिर मैं विश्लेषण करूँगा।"));
      else {
        lines.push(S(`${m.title}: ${m.percent}% score, ${pct(m.accuracy)} accuracy, ${pct(m.attemptRate)} attempted.`, `${m.title}: स्कोर ${m.percent}%, सटीकता ${pct(m.accuracy)}, ${pct(m.attemptRate)} प्रश्न हल किए।`));
        const subj = [...m.bySubject].filter((s) => s.accuracy !== null).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
        if (subj.length) lines.push(S(`Weakest: ${subj[0].name} (${pct(subj[0].accuracy)}). Strongest: ${subj[subj.length - 1].name} (${pct(subj[subj.length - 1].accuracy)}).`, `सबसे कमज़ोर: ${subj[0].name} (${pct(subj[0].accuracy)})। सबसे मज़बूत: ${subj[subj.length - 1].name} (${pct(subj[subj.length - 1].accuracy)})।`));
        if (m.overconfidentCount) lines.push(S(`${m.overconfidentCount} answers were wrong despite high confidence. Check them for traps.`, `${m.overconfidentCount} उत्तर पूरे भरोसे के बावजूद गलत थे। इन्हें ध्यान से देखें।`));
      }
      break;
    }
    case "READINESS": {
      if (c.readiness) lines.push(S(`Preparation Readiness: ${c.readiness.score}/100 (confidence: ${c.readiness.confidence.toLowerCase()}). This is an estimate from your data, not a probability of selection.`, `तैयारी स्कोर: ${c.readiness.score}/100 (भरोसा: ${c.readiness.confidence.toLowerCase()})। यह आपके डेटा से अनुमान है, चयन की संभावना नहीं।`));
      lines.push(c.pace.summary);
      break;
    }
    case "MOTIVATION": {
      const tips = H
        ? ["सिर्फ 25 मिनट का एक ब्लॉक शुरू करें: ⏱ टाइमर दबाएँ, फ़ोन दूसरे कमरे में रखें। शुरू करना ही सबसे मुश्किल हिस्सा है।", "थकान है तो आसान काम चुनें: रिवीज़न या गलतियों की कॉपी। कुछ न करने से थोड़ा करना बेहतर है।", "नींद 7 घंटे पूरी करें। थका दिमाग कम याद रखता है, और देर रात की पढ़ाई अक्सर कम असरदार होती है।", "आज के छोटे लक्ष्य पर ध्यान दें, पूरे सिलेबस पर नहीं। एक टॉपिक = एक जीत।"]
        : ["Start just one 25-minute block: tap ⏱ Timer and put your phone in another room. Starting is the hardest part.", "Tired? Pick an easy win like revision or the mistake book. A little beats nothing.", "Protect 7 hours of sleep. A tired brain retains less, and late-night sessions are often less effective.", "Focus on today's small target, not the whole syllabus. One topic = one win."];
      lines.push(pick(tips));
      lines.push(S(`You've kept a ${c.progress.streak}-day streak and studied ${formatMinutes(c.progress.weekMinutes)} in the last week. That's real progress.`, `आपने ${c.progress.streak} दिन लगातार पढ़ाई की है और पिछले हफ़्ते ${formatMinutes(c.progress.weekMinutes)} पढ़े। यह असली प्रगति है।`));
      break;
    }
    case "PROGRESS": {
      lines.push(S(`Level ${c.progress.level} (${c.progress.xp} XP) · streak ${c.progress.streak} days (best ${c.progress.bestStreak}).`, `लेवल ${c.progress.level} (${c.progress.xp} XP) · लगातार ${c.progress.streak} दिन (सबसे ज़्यादा ${c.progress.bestStreak})।`));
      lines.push(S(`Today: ${formatMinutes(c.progress.todayMinutes)}. Last 7 days: ${formatMinutes(c.progress.weekMinutes)}.`, `आज: ${formatMinutes(c.progress.todayMinutes)}। पिछले 7 दिन: ${formatMinutes(c.progress.weekMinutes)}।`));
      lines.push(S("See the full month in 📅 Attendance.", "पूरा महीना 📅 हाज़िरी में देखें।"));
      break;
    }
    case "TIMETABLE": {
      lines.push(S(`Your plan is built each morning from ${c.student.dailyAvailable} of available time and your preferred study slots:`, `आपका प्लान हर सुबह आपके ${c.student.dailyAvailable} के समय और पसंदीदा समय से बनता है:`));
      c.today.tasks.slice(0, 5).forEach((t) => lines.push(`• ${t.title} (${t.minutes} ${S("min", "मिनट")})`));
      lines.push(S("Change hours and times in Profile → Study settings. Set ⏰ Alarms to get reminded.", "प्रोफ़ाइल → पढ़ाई की सेटिंग में समय बदलें। ⏰ अलार्म लगाएँ ताकि याद दिलाया जाए।"));
      break;
    }
    case "HOW_TO": {
      lines.push(S("Quick guide:", "छोटी सी गाइड:"));
      lines.push(S("1. ⏱ Timer: tap when you sit to study, stop when done. Time and points are saved.", "1. ⏱ टाइमर: पढ़ने बैठें तो दबाएँ, खत्म होने पर रोकें। समय और अंक सेव हो जाते हैं।"));
      lines.push(S("2. Plan: today's tasks with reasons. Drag to reorder.", "2. प्लान: आज के काम, कारण के साथ। खींचकर क्रम बदलें।"));
      lines.push(S("3. 📚 My syllabus: add your own chapters and mark them done.", "3. 📚 मेरा सिलेबस: अपने चैप्टर जोड़ें और पूरे होने पर मार्क करें।"));
      lines.push(S("4. 📅 Attendance and ⏰ Alarms are on Home. Full guide: Profile → Help.", "4. 📅 हाज़िरी और ⏰ अलार्म होम पर हैं। पूरी गाइड: प्रोफ़ाइल → मदद।"));
      break;
    }
    default: {
      lines.push(S("I'm the built-in coach and didn't fully understand that question.", "मैं बिल्ट-इन कोच हूँ और यह सवाल पूरी तरह समझ नहीं पाया।"));
      if (top[0]) lines.push(S(`Right now your top priority is ${top[0].topic}${top[0].reasons[0] ? ` (${top[0].reasons[0]})` : ""}.`, `अभी आपकी सबसे ज़रूरी चीज़: ${top[0].topic}${top[0].reasons[0] ? ` (${top[0].reasons[0]})` : ""}।`));
      if (c.mistakes.top) lines.push(S(`Tip: ${MISTAKE_FIXES[c.mistakes.top.category]}`, "सुझाव: हर प्रश्न का आखिरी हिस्सा ध्यान से पढ़ें और हिसाब दोबारा जाँचें।"));
      const examples = H
        ? ["\"आज क्या पढ़ूँ?\"", "\"मेरे पास सिर्फ 2 घंटे हैं\"", "\"percentage कैसे सुधारूँ?\"", "\"पिछला टेस्ट कैसा रहा?\"", "\"रिवीज़न प्लान बनाओ\"", "\"मेरी स्ट्रीक कितनी है?\"", "\"पढ़ने का मन नहीं कर रहा\""]
        : ["\"What should I study today?\"", "\"I have only 2 hours\"", "\"How do I improve Percentage?\"", "\"Analyze my last mock\"", "\"Create a revision plan\"", "\"What's my streak?\"", "\"I don't feel like studying\""];
      const shuffled = [...examples].sort(() => Math.random() - 0.5).slice(0, 3);
      lines.push(S(`Try asking: ${shuffled.join(", ")}`, `ऐसे पूछें: ${shuffled.join(", ")}`));
    }
  }
  return { intent, answer: lines.join("\n") };
}

export const COACH_SYSTEM = `You are RozPadh's study coach for a student in India.
Reply in the same language and script the student uses: Hindi in Devanagari if they write Hindi, Hinglish if they write Hinglish, otherwise English.
Answer any study-related question. Use the student's measured data in the JSON context when it is relevant, citing specific numbers, topics and dates.
Prefer concrete next actions (what to study, for how long, in what order) over generic motivation.
Keep answers under about 180 words, using short lines or a numbered list.
Never claim or imply a probability of selection or a guaranteed result. Readiness is an estimate of preparation, not a prediction.
If the data needed isn't in the context, say what's missing and how the student can generate it.
Be supportive and factual, never shaming.`;
