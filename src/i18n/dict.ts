// UI strings. Add a language by adding an object with the same keys.
// Generated explanations from the engines (task reasons, insights) are English for now.
const en = {
  "nav.home": "Home", "nav.plan": "Plan", "nav.study": "Study", "nav.tests": "Tests", "nav.analytics": "Analytics", "nav.profile": "Profile", "nav.coach": "AI Coach", "nav.admin": "Admin",
  "nav.skip": "Skip to content", "nav.notifications": "Notifications", "nav.help": "Report a problem",
  "offline.banner": "Offline: today's plan and your timer still work. Changes will sync when you reconnect.",
  "offline.pending": "{n} change(s) waiting to sync…",

  "common.save": "Save", "common.cancel": "Cancel", "common.start": "Start", "common.back": "Back", "common.continue": "Continue", "common.skip": "Skip", "common.edit": "Edit", "common.add": "Add",
  "common.min": "min", "common.questions": "questions", "common.daysLeft": "days left", "common.tryAgain": "Try again", "common.estimate": "Estimate", "common.measured": "Measured",

  "home.greeting.morning": "Good morning", "home.greeting.afternoon": "Good afternoon", "home.greeting.evening": "Good evening",
  "home.preparation": "{exam} preparation", "home.nextAction": "Next action", "home.planComplete": "Today's plan is complete 🎉", "home.startStudy": "▶ Start study", "home.why": "Why this?",
  "home.doneText": "Great work. If you still have energy, clear a due revision or re-solve a mistake. Otherwise, rest well.",
  "home.progress": "Today's progress", "home.tasksDone": "Tasks done", "home.dailyScore": "Daily score", "home.afterFirst": "after your first session",
  "home.yesterday": "Yesterday", "home.improve": "One thing to improve:", "home.readiness": "Readiness", "home.howCalculated": "How it's calculated →",
  "home.thisWeek": "{n} this week", "home.notMeasured": "not measured yet", "home.confidence": "Confidence", "home.notProbability": "A preparation estimate, not a probability of selection.",
  "home.attention": "You need attention", "home.noAttention": "No weak topics or overdue revisions detected right now. Weak topics appear after about 10 attempts per topic.",
  "home.week": "This week", "home.weeklyReport": "Weekly report →", "home.study": "Study", "home.accuracy": "Accuracy", "home.mocks": "Mocks", "home.consistency": "Consistency", "home.level": "Level",
  "home.momentum": "Momentum", "home.streak": "{n}-day streak", "home.bestStreak": "Best: {n} days. One rest day a week doesn't break it.",
  "home.nextMilestone": "Next milestone", "home.challenge": "Weekly challenge", "home.recoveryTitle": "Recovery mode",
  "home.recoveryText": "You are behind your original plan. We will not try to complete everything at once. Today focuses on high-value topics, weak areas and due revision.",
  "home.seePlan": "See plan", "home.eveningTitle": "Evening review", "home.eveningText": "Two minutes to close the day: what went well, what got in the way.", "home.reviewToday": "Review today",
  "home.highPriority": "High priority", "home.mediumPriority": "Medium priority", "home.revision": "Revision",

  "plan.title": "Today's plan", "plan.replan": "Re-plan", "plan.adapted": "How today was adapted", "plan.planned": "Planned", "plan.actual": "Actual",
  "plan.unfinished": "Unfinished work: nothing is silently dropped", "plan.recovery": "Recovery mode", "plan.turnOn": "Turn on", "plan.turnOff": "Turn off",
  "plan.recoveryHint": "Switches automatically when several days fall below 50%. Turn it on yourself if you know a busy stretch is coming.",
  "plan.comingDays": "Coming days", "plan.whyScheduled": "Why scheduled", "plan.addTask": "Add a task", "plan.editTask": "Edit task",

  "study.title": "Study", "study.subtitle": "Pick a block and start a focus session.", "study.free": "Free session", "study.blocks": "Today's study blocks",
  "study.revisionDue": "Revision due", "study.mistakes": "Mistakes to fix", "study.mistakeBook": "Mistake book →", "study.all": "All →",
  "focus.start": "Start focus session", "focus.countdown": "Countdown", "focus.stopwatch": "Stopwatch", "focus.duration": "Duration (minutes)",
  "focus.tip": "Tip: put your phone in another room. Tap \"Distracted\" whenever your attention drifts. It's for your insight, not a penalty.",
  "focus.focus": "Focus", "focus.break": "Break", "focus.paused": "Paused", "focus.pause": "Pause", "focus.resume": "Resume", "focus.continue": "Continue", "focus.distracted": "Distracted",
  "focus.notes": "Session notes (optional)", "focus.fullscreen": "Full screen", "focus.end": "End session",
  "focus.whatCompleted": "What did you actually complete?", "focus.actualFocus": "Actual focus", "focus.howMuch": "How much of the task did you finish?",
  "focus.attempted": "Questions attempted", "focus.correct": "Correct", "focus.difficulty": "Difficulty", "focus.focusRating": "Focus", "focus.energy": "Energy",
  "focus.recall": "How well did you recall it?", "focus.backToTimer": "Back to timer", "focus.saveSession": "Save session", "focus.saving": "Saving…", "focus.saved": "Session saved",
  "focus.noXp": "No XP for this one. Study XP needs at least 5 focused minutes.",

  "tests.title": "Tests", "tests.build": "Build a practice test", "tests.trend": "Score trend", "tests.analysis": "Analysis", "tests.retake": "Retake", "tests.resume": "Resume",
  "test.sure": "How sure are you? (helps detect overconfidence)", "test.guessing": "Guessing", "test.fairly": "Fairly sure", "test.certain": "Certain",
  "test.prev": "← Prev", "test.next": "Next →", "test.mark": "Mark for review", "test.unmark": "Unmark", "test.finish": "Finish", "test.submit": "Submit test", "test.submitNow": "Submit now?",
  "test.keepGoing": "Keep going", "test.scoring": "Scoring…", "test.answered": "{a}/{b} answered",

  "analytics.title": "Analytics", "profile.goals": "Goals (exam → month → week → today)", "profile.badges": "Badges", "profile.more": "More",
  "settings.study": "Study settings", "settings.language": "Language", "settings.notifications": "Notifications", "settings.privacy": "Privacy & data",
  "settings.saveSettings": "Save settings", "settings.saveNotifications": "Save notifications", "settings.download": "Download my data (JSON)", "settings.signOut": "Sign out",
  "push.title": "Phone / browser notifications", "push.enable": "Turn on notifications on this device", "push.disable": "Turn off on this device", "push.test": "Send a test notification",
  "push.on": "On for this device", "push.blocked": "Notifications are blocked in your browser settings for this site.", "push.unsupported": "This browser doesn't support push notifications. On iPhone, first add PrepPilot to your Home Screen.",
  "push.hint": "Reminders arrive even when the app is closed. Max a few per day, never during quiet hours.",

  "auth.name": "Your name", "auth.email": "Email", "auth.password": "Password", "auth.min8": "At least 8 characters.", "auth.signIn": "Sign in", "auth.create": "Create account",
  "auth.wait": "Please wait…", "auth.google": "Continue with Google", "auth.new": "New here?", "auth.createLink": "Create an account", "auth.have": "Already have an account?", "auth.signInLink": "Sign in",

  "fb.title": "Report a problem", "fb.subtitle": "Tell us what went wrong or what could be better. It goes straight to the PrepPilot team.",
  "fb.category": "What is it about?", "fb.BUG": "Something isn't working", "fb.CONTENT_ERROR": "Wrong question or answer", "fb.SUGGESTION": "Suggestion", "fb.ACCOUNT": "Account / login", "fb.OTHER": "Other",
  "fb.message": "Describe the problem", "fb.placeholder": "What happened? What did you expect?", "fb.contact": "Email for our reply (optional)", "fb.send": "Send report", "fb.sending": "Sending…",
  "fb.thanks": "Thank you! Your report has been sent. We'll look into it.",

  "notif.title": "Notifications", "notif.caughtUp": "You're all caught up", "night.title": "Night review", "coach.title": "AI Coach", "coach.placeholder": "Ask your coach…", "coach.send": "Send",
} as const;

export type Key = keyof typeof en;

const hi: Record<Key, string> = {
  "nav.home": "होम", "nav.plan": "प्लान", "nav.study": "पढ़ाई", "nav.tests": "टेस्ट", "nav.analytics": "विश्लेषण", "nav.profile": "प्रोफ़ाइल", "nav.coach": "AI कोच", "nav.admin": "एडमिन",
  "nav.skip": "मुख्य भाग पर जाएँ", "nav.notifications": "सूचनाएँ", "nav.help": "समस्या बताएँ",
  "offline.banner": "ऑफ़लाइन: आज का प्लान और टाइमर चलते रहेंगे। इंटरनेट आने पर बदलाव सिंक हो जाएँगे।",
  "offline.pending": "{n} बदलाव सिंक होने बाकी हैं…",

  "common.save": "सेव करें", "common.cancel": "रद्द करें", "common.start": "शुरू करें", "common.back": "पीछे", "common.continue": "आगे बढ़ें", "common.skip": "छोड़ें", "common.edit": "बदलें", "common.add": "जोड़ें",
  "common.min": "मिनट", "common.questions": "प्रश्न", "common.daysLeft": "दिन बाकी", "common.tryAgain": "फिर कोशिश करें", "common.estimate": "अनुमान", "common.measured": "मापा गया",

  "home.greeting.morning": "सुप्रभात", "home.greeting.afternoon": "नमस्ते", "home.greeting.evening": "शुभ संध्या",
  "home.preparation": "{exam} की तैयारी", "home.nextAction": "अगला काम", "home.planComplete": "आज का प्लान पूरा हो गया 🎉", "home.startStudy": "▶ पढ़ाई शुरू करें", "home.why": "यह क्यों?",
  "home.doneText": "शानदार! ऊर्जा बाकी हो तो कोई रिवीज़न या गलती दोबारा हल करें, नहीं तो आराम करें।",
  "home.progress": "आज की प्रगति", "home.tasksDone": "पूरे काम", "home.dailyScore": "आज का स्कोर", "home.afterFirst": "पहले सेशन के बाद",
  "home.yesterday": "कल", "home.improve": "सुधार की एक बात:", "home.readiness": "तैयारी स्कोर", "home.howCalculated": "कैसे गिना जाता है →",
  "home.thisWeek": "इस हफ़्ते {n}", "home.notMeasured": "अभी मापा नहीं गया", "home.confidence": "भरोसा", "home.notProbability": "यह तैयारी का अनुमान है, चयन की संभावना नहीं।",
  "home.attention": "ध्यान देने वाली बातें", "home.noAttention": "अभी कोई कमज़ोर टॉपिक या छूटा रिवीज़न नहीं है। किसी टॉपिक के ~10 प्रश्नों के बाद कमज़ोरी पता चलती है।",
  "home.week": "यह हफ़्ता", "home.weeklyReport": "साप्ताहिक रिपोर्ट →", "home.study": "पढ़ाई", "home.accuracy": "सटीकता", "home.mocks": "मॉक", "home.consistency": "नियमितता", "home.level": "लेवल",
  "home.momentum": "रफ़्तार", "home.streak": "{n} दिन लगातार", "home.bestStreak": "सबसे ज़्यादा: {n} दिन। हफ़्ते में एक आराम का दिन गिनती नहीं तोड़ता।",
  "home.nextMilestone": "अगला पड़ाव", "home.challenge": "साप्ताहिक चुनौती", "home.recoveryTitle": "रिकवरी मोड",
  "home.recoveryText": "आप अपने मूल प्लान से पीछे हैं। हम सब कुछ एक साथ पूरा करने की कोशिश नहीं करेंगे। आज ज़रूरी टॉपिक, कमज़ोर हिस्से और रिवीज़न पर ध्यान है।",
  "home.seePlan": "प्लान देखें", "home.eveningTitle": "शाम की समीक्षा", "home.eveningText": "दिन खत्म करने में दो मिनट: क्या अच्छा रहा, क्या रुकावट आई।", "home.reviewToday": "आज की समीक्षा",
  "home.highPriority": "ज़्यादा ज़रूरी", "home.mediumPriority": "मध्यम ज़रूरी", "home.revision": "रिवीज़न",

  "plan.title": "आज का प्लान", "plan.replan": "दोबारा प्लान", "plan.adapted": "आज का प्लान कैसे बदला गया", "plan.planned": "तय", "plan.actual": "असल",
  "plan.unfinished": "अधूरा काम: कुछ भी चुपचाप हटाया नहीं जाता", "plan.recovery": "रिकवरी मोड", "plan.turnOn": "चालू करें", "plan.turnOff": "बंद करें",
  "plan.recoveryHint": "कई दिन 50% से कम काम होने पर यह अपने-आप चालू हो जाता है। व्यस्त दिन आने वाले हों तो खुद चालू करें।",
  "plan.comingDays": "आने वाले दिन", "plan.whyScheduled": "क्यों रखा गया", "plan.addTask": "काम जोड़ें", "plan.editTask": "काम बदलें",

  "study.title": "पढ़ाई", "study.subtitle": "एक ब्लॉक चुनें और फ़ोकस सेशन शुरू करें।", "study.free": "खुला सेशन", "study.blocks": "आज के पढ़ाई ब्लॉक",
  "study.revisionDue": "रिवीज़न बाकी", "study.mistakes": "सुधारने वाली गलतियाँ", "study.mistakeBook": "गलतियों की कॉपी →", "study.all": "सभी →",
  "focus.start": "फ़ोकस सेशन शुरू करें", "focus.countdown": "उल्टी गिनती", "focus.stopwatch": "स्टॉपवॉच", "focus.duration": "समय (मिनट)",
  "focus.tip": "सुझाव: फ़ोन दूसरे कमरे में रखें। ध्यान भटके तो \"ध्यान भटका\" दबाएँ। यह आपकी समझ के लिए है, सज़ा नहीं।",
  "focus.focus": "फ़ोकस", "focus.break": "ब्रेक", "focus.paused": "रुका हुआ", "focus.pause": "रोकें", "focus.resume": "फिर शुरू", "focus.continue": "जारी रखें", "focus.distracted": "ध्यान भटका",
  "focus.notes": "सेशन नोट्स (वैकल्पिक)", "focus.fullscreen": "पूरी स्क्रीन", "focus.end": "सेशन खत्म करें",
  "focus.whatCompleted": "आपने असल में क्या पूरा किया?", "focus.actualFocus": "असल फ़ोकस", "focus.howMuch": "काम का कितना हिस्सा पूरा हुआ?",
  "focus.attempted": "हल किए प्रश्न", "focus.correct": "सही", "focus.difficulty": "कठिनाई", "focus.focusRating": "फ़ोकस", "focus.energy": "ऊर्जा",
  "focus.recall": "कितना याद रहा?", "focus.backToTimer": "टाइमर पर वापस", "focus.saveSession": "सेशन सेव करें", "focus.saving": "सेव हो रहा है…", "focus.saved": "सेशन सेव हो गया",
  "focus.noXp": "इस सेशन के XP नहीं मिले। कम से कम 5 मिनट फ़ोकस चाहिए।",

  "tests.title": "टेस्ट", "tests.build": "प्रैक्टिस टेस्ट बनाएँ", "tests.trend": "स्कोर का रुझान", "tests.analysis": "विश्लेषण", "tests.retake": "दोबारा दें", "tests.resume": "जारी रखें",
  "test.sure": "आप कितने पक्के हैं? (ज़रूरत से ज़्यादा भरोसा पकड़ने में मदद करता है)", "test.guessing": "अंदाज़ा", "test.fairly": "काफ़ी पक्का", "test.certain": "पूरा पक्का",
  "test.prev": "← पिछला", "test.next": "अगला →", "test.mark": "बाद में देखें", "test.unmark": "निशान हटाएँ", "test.finish": "खत्म करें", "test.submit": "टेस्ट जमा करें", "test.submitNow": "अभी जमा करें?",
  "test.keepGoing": "जारी रखें", "test.scoring": "जाँच हो रही है…", "test.answered": "{a}/{b} उत्तर दिए",

  "analytics.title": "विश्लेषण", "profile.goals": "लक्ष्य (परीक्षा → महीना → हफ़्ता → आज)", "profile.badges": "बैज", "profile.more": "और",
  "settings.study": "पढ़ाई की सेटिंग", "settings.language": "भाषा", "settings.notifications": "सूचनाएँ", "settings.privacy": "गोपनीयता और डेटा",
  "settings.saveSettings": "सेटिंग सेव करें", "settings.saveNotifications": "सूचना सेटिंग सेव करें", "settings.download": "मेरा डेटा डाउनलोड करें (JSON)", "settings.signOut": "लॉग आउट",
  "push.title": "फ़ोन / ब्राउज़र सूचनाएँ", "push.enable": "इस डिवाइस पर सूचनाएँ चालू करें", "push.disable": "इस डिवाइस पर बंद करें", "push.test": "टेस्ट सूचना भेजें",
  "push.on": "इस डिवाइस पर चालू", "push.blocked": "इस साइट के लिए ब्राउज़र सेटिंग में सूचनाएँ बंद हैं।", "push.unsupported": "यह ब्राउज़र पुश सूचनाएँ नहीं देता। iPhone पर पहले PrepPilot को होम स्क्रीन पर जोड़ें।",
  "push.hint": "ऐप बंद होने पर भी रिमाइंडर आएँगे। दिन में कुछ ही, और शांत समय में कभी नहीं।",

  "auth.name": "आपका नाम", "auth.email": "ईमेल", "auth.password": "पासवर्ड", "auth.min8": "कम से कम 8 अक्षर।", "auth.signIn": "लॉग इन करें", "auth.create": "खाता बनाएँ",
  "auth.wait": "कृपया रुकें…", "auth.google": "Google से जारी रखें", "auth.new": "नए हैं?", "auth.createLink": "खाता बनाएँ", "auth.have": "पहले से खाता है?", "auth.signInLink": "लॉग इन करें",

  "fb.title": "समस्या बताएँ", "fb.subtitle": "बताइए क्या गलत हुआ या क्या बेहतर हो सकता है। यह सीधे PrepPilot टीम तक पहुँचता है।",
  "fb.category": "किस बारे में है?", "fb.BUG": "कुछ काम नहीं कर रहा", "fb.CONTENT_ERROR": "प्रश्न या उत्तर गलत है", "fb.SUGGESTION": "सुझाव", "fb.ACCOUNT": "खाता / लॉगिन", "fb.OTHER": "अन्य",
  "fb.message": "समस्या लिखें", "fb.placeholder": "क्या हुआ? आप क्या उम्मीद कर रहे थे?", "fb.contact": "जवाब के लिए ईमेल (वैकल्पिक)", "fb.send": "भेजें", "fb.sending": "भेजा जा रहा है…",
  "fb.thanks": "धन्यवाद! आपकी शिकायत भेज दी गई है। हम इसे देखेंगे।",

  "notif.title": "सूचनाएँ", "notif.caughtUp": "कोई नई सूचना नहीं", "night.title": "रात की समीक्षा", "coach.title": "AI कोच", "coach.placeholder": "अपने कोच से पूछें…", "coach.send": "भेजें",
};

export const DICTS = { en: en as Record<Key, string>, hi };
export type Lang = keyof typeof DICTS;
export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
];

export function isLang(x: unknown): x is Lang {
  return typeof x === "string" && x in DICTS;
}

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>) {
  let s = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
