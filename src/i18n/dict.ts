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
  "push.on": "On for this device", "push.blocked": "Notifications are blocked in your browser settings for this site.", "push.unsupported": "This browser doesn't support push notifications. On iPhone, first add RozPadh to your Home Screen.",
  "push.hint": "Reminders arrive even when the app is closed. Max a few per day, never during quiet hours.",

  "auth.name": "Your name", "auth.email": "Email", "auth.password": "Password", "auth.min8": "At least 8 characters.", "auth.signIn": "Sign in", "auth.create": "Create account",
  "auth.wait": "Please wait…", "auth.google": "Continue with Google", "auth.new": "New here?", "auth.createLink": "Create an account", "auth.have": "Already have an account?", "auth.signInLink": "Sign in",

  "fb.title": "Report a problem", "fb.subtitle": "Tell us what went wrong or what could be better. It goes straight to the RozPadh team.",
  "fb.category": "What is it about?", "fb.BUG": "Something isn't working", "fb.CONTENT_ERROR": "Wrong question or answer", "fb.SUGGESTION": "Suggestion", "fb.ACCOUNT": "Account / login", "fb.OTHER": "Other",
  "fb.message": "Describe the problem", "fb.placeholder": "What happened? What did you expect?", "fb.contact": "Email for our reply (optional)", "fb.send": "Send report", "fb.sending": "Sending…",
  "fb.thanks": "Thank you! Your report has been sent. We'll look into it.",

  "notif.title": "Notifications", "notif.caughtUp": "You're all caught up", "night.title": "Night review", "coach.title": "AI Coach", "coach.placeholder": "Ask your coach…", "coach.send": "Send",
  "coach.rulesNote": "Built-in coach: answers from your own data in Hindi or English. For free-form answers to any question, the owner can switch on the full AI coach.",
  "nav.howto": "Help / How to use",
  "quick.timer": "Timer", "quick.attendance": "Attendance", "quick.alarm": "Alarms", "quick.syllabus": "My syllabus",
  "home.addChapters": "Your syllabus has no chapters yet. Add the chapters from your book, and your daily plan starts from them.",
  "att.title": "Attendance", "att.subtitle": "Your month at a glance: study days, leave days and missed days.", "att.present": "Studied", "att.low": "A little", "att.leave": "Leave", "att.absent": "Missed", "att.today": "Today",
  "att.leaveSaved": "Marked as leave. Nothing is planned that day and your streak is safe.", "att.leaveRemoved": "Leave removed.", "att.studied": "Studied", "att.sessions": "Sessions",
  "att.notePlaceholder": "Reason (optional), e.g. family function", "att.markLeave": "☾ Mark as leave", "att.removeLeave": "Remove leave",
  "att.leaveHint": "Leave days don't break your streak. The plan moves unfinished work to your next study day.", "att.monthSummary": "This month", "att.total": "Total study", "att.best": "Best day",
  "alarm.title": "Study alarms", "alarm.subtitle": "Get a reminder on your phone at your study time.", "alarm.new": "New alarm", "alarm.time": "Time", "alarm.label": "Name (optional)", "alarm.labelPlaceholder": "e.g. Morning Maths",
  "alarm.days": "Days", "alarm.add": "Set alarm", "alarm.saved": "Alarm set for {time}.", "alarm.mine": "My alarms", "alarm.none": "No alarms yet", "alarm.everyday": "Every day", "alarm.onOff": "on/off", "alarm.delete": "Delete",
  "alarm.note": "Alarms arrive as phone notifications (with your phone's notification sound) when notifications are on for this device. They can arrive a few minutes late.",
  "ob.purpose": "What are you studying for?", "ob.purpose.EXAM": "🎯 Competitive exam", "ob.purpose.SCHOOL": "🏫 School / College", "ob.purpose.SELF": "🌱 Self development", "ob.purpose.SKILL": "🛠 Learning a skill",
  "ob.pickExam": "Choose your exam", "ob.pickGoal": "Your goal", "ob.notListed": "My exam/goal isn't listed: create my own syllabus", "ob.notListedHint": "Type your own subjects, book and chapters. Change them anytime.",
  "ob.examDate": "Exam date", "ob.targetDate": "Target date (by when do you want to finish?)",
  "ob.custom.title": "Your own syllabus", "ob.custom.goal": "Exam or goal name", "ob.custom.goalPlaceholder": "e.g. UP Police Constable, Class 12 Board, Learn Excel",
  "ob.custom.subject": "Subject", "ob.custom.subjectPlaceholder": "Subject name, e.g. Physics", "ob.custom.book": "Book", "ob.custom.bookPlaceholder": "Book you study from (optional), e.g. NCERT Class 12",
  "ob.custom.chapters": "Chapters", "ob.custom.chaptersPlaceholder": "Chapters, one per line (optional; you can add them later)\ne.g.\nElectric Charges\nCurrent Electricity",
  "ob.custom.addSubject": "Add another subject", "ob.custom.later": "You can add, rename or remove subjects and chapters later in 📚 My syllabus.", "ob.custom.create": "Save my syllabus",
  "ob.custom.needGoal": "Please enter your exam or goal name.", "ob.custom.needSubject": "Add at least one subject.",
  "syl.title": "My syllabus", "syl.chaptersDone": "chapters done", "syl.change": "Change exam/goal",
  "syl.hintEditable": "This is your own syllabus. Tap a name to rename it, add chapters in any order, and tap the circle to mark progress: ○ → ◐ → ✓.",
  "syl.hintReady": "This is a ready-made syllabus. Tap the circle to mark progress: ○ not started → ◐ studying → ✓ done. Want your own chapters and book? Tap “Change exam/goal” and create your own.",
  "syl.empty": "No subjects yet", "syl.confirmDeleteSubject": "Delete this subject and all its chapters?", "syl.confirmDeleteChapter": "Delete this chapter?",
  "syl.NOT_STARTED": "not started", "syl.IN_PROGRESS": "studying", "syl.COMPLETED": "done", "syl.added": "{n} chapter(s) added.", "syl.addChapters": "Add chapters (one per line)",
  "install.title": "Install RozPadh", "install.button": "Install app", "install.bannerTitle": "Get the RozPadh app", "install.bannerText": "Opens full-screen from your home screen, works offline, sends reminders.",
  "install.ios1": "In Safari, tap the Share button ⬆️ at the bottom.", "install.ios2": "Scroll and tap “Add to Home Screen”.", "install.ios3": "Tap “Add”. Open RozPadh from your home screen.",
  "install.android1": "Open this page in Chrome.", "install.android2": "Tap the ⋮ menu (top right).", "install.android3": "Tap “Install app” or “Add to Home screen”.",
  "install.note": "It installs like a normal app: its own icon, full screen and notifications, and it takes very little space.",
  "install.inapp": "You opened this link inside another app (like WhatsApp or Instagram). Apps can't be installed from there, so open it in your browser first.",
  "install.openChrome": "Open in Chrome", "install.inappManual": "If that doesn't work: tap ⋮ (top right) → “Open in browser” / “Open in Chrome”, then tap Install app.",
  "install.inappIos": "Tap ••• or the compass icon → “Open in Safari”. Then Share ⬆️ → “Add to Home Screen”.",
  "install.samsung1": "Tap the ≡ menu at the bottom.", "install.samsung2": "Tap “Add page to” → “Home screen” (or “Install”).",
  "tests.personalTitle": "Your own syllabus", "tests.personalText": "Ready-made mock tests are only available for listed exams. Track your study with ⏱ Timer, 📚 My syllabus, 📅 Attendance and ⏰ Alarms.",
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
  "push.on": "इस डिवाइस पर चालू", "push.blocked": "इस साइट के लिए ब्राउज़र सेटिंग में सूचनाएँ बंद हैं।", "push.unsupported": "यह ब्राउज़र पुश सूचनाएँ नहीं देता। iPhone पर पहले RozPadh को होम स्क्रीन पर जोड़ें।",
  "push.hint": "ऐप बंद होने पर भी रिमाइंडर आएँगे। दिन में कुछ ही, और शांत समय में कभी नहीं।",

  "auth.name": "आपका नाम", "auth.email": "ईमेल", "auth.password": "पासवर्ड", "auth.min8": "कम से कम 8 अक्षर।", "auth.signIn": "लॉग इन करें", "auth.create": "खाता बनाएँ",
  "auth.wait": "कृपया रुकें…", "auth.google": "Google से जारी रखें", "auth.new": "नए हैं?", "auth.createLink": "खाता बनाएँ", "auth.have": "पहले से खाता है?", "auth.signInLink": "लॉग इन करें",

  "fb.title": "समस्या बताएँ", "fb.subtitle": "बताइए क्या गलत हुआ या क्या बेहतर हो सकता है। यह सीधे RozPadh टीम तक पहुँचता है।",
  "fb.category": "किस बारे में है?", "fb.BUG": "कुछ काम नहीं कर रहा", "fb.CONTENT_ERROR": "प्रश्न या उत्तर गलत है", "fb.SUGGESTION": "सुझाव", "fb.ACCOUNT": "खाता / लॉगिन", "fb.OTHER": "अन्य",
  "fb.message": "समस्या लिखें", "fb.placeholder": "क्या हुआ? आप क्या उम्मीद कर रहे थे?", "fb.contact": "जवाब के लिए ईमेल (वैकल्पिक)", "fb.send": "भेजें", "fb.sending": "भेजा जा रहा है…",
  "fb.thanks": "धन्यवाद! आपकी शिकायत भेज दी गई है। हम इसे देखेंगे।",

  "notif.title": "सूचनाएँ", "notif.caughtUp": "कोई नई सूचना नहीं", "night.title": "रात की समीक्षा", "coach.title": "AI कोच", "coach.placeholder": "अपने कोच से पूछें…", "coach.send": "भेजें",
  "coach.rulesNote": "बिल्ट-इन कोच: आपके डेटा से हिंदी या अंग्रेज़ी में जवाब देता है। किसी भी सवाल का खुला जवाब चाहिए तो ऐप के मालिक पूरा AI कोच चालू कर सकते हैं।",
  "nav.howto": "मदद / कैसे इस्तेमाल करें",
  "quick.timer": "टाइमर", "quick.attendance": "हाज़िरी", "quick.alarm": "अलार्म", "quick.syllabus": "मेरा सिलेबस",
  "home.addChapters": "आपके सिलेबस में अभी कोई चैप्टर नहीं है। अपनी किताब के चैप्टर जोड़ें, रोज़ का प्लान उन्हीं से बनेगा।",
  "att.title": "हाज़िरी", "att.subtitle": "पूरा महीना एक नज़र में: पढ़ाई के दिन, छुट्टी और छूटे दिन।", "att.present": "पढ़ा", "att.low": "थोड़ा", "att.leave": "छुट्टी", "att.absent": "नहीं पढ़ा", "att.today": "आज",
  "att.leaveSaved": "छुट्टी मार्क हो गई। उस दिन कुछ प्लान नहीं होगा और स्ट्रीक सुरक्षित रहेगी।", "att.leaveRemoved": "छुट्टी हटा दी गई।", "att.studied": "पढ़ाई", "att.sessions": "सेशन",
  "att.notePlaceholder": "कारण (वैकल्पिक), जैसे शादी/फ़ंक्शन", "att.markLeave": "☾ छुट्टी मार्क करें", "att.removeLeave": "छुट्टी हटाएँ",
  "att.leaveHint": "छुट्टी से स्ट्रीक नहीं टूटती। अधूरा काम अगले पढ़ाई वाले दिन पर चला जाता है।", "att.monthSummary": "इस महीने", "att.total": "कुल पढ़ाई", "att.best": "सबसे अच्छा दिन",
  "alarm.title": "पढ़ाई का अलार्म", "alarm.subtitle": "पढ़ाई के समय पर फ़ोन पर याद दिलाने वाला अलार्म।", "alarm.new": "नया अलार्म", "alarm.time": "समय", "alarm.label": "नाम (वैकल्पिक)", "alarm.labelPlaceholder": "जैसे सुबह का Maths",
  "alarm.days": "दिन", "alarm.add": "अलार्म लगाएँ", "alarm.saved": "{time} का अलार्म लग गया।", "alarm.mine": "मेरे अलार्म", "alarm.none": "अभी कोई अलार्म नहीं", "alarm.everyday": "रोज़", "alarm.onOff": "चालू/बंद", "alarm.delete": "हटाएँ",
  "alarm.note": "इस डिवाइस पर सूचनाएँ चालू हों तो अलार्म फ़ोन पर सूचना बनकर आता है, फ़ोन की सूचना वाली आवाज़ के साथ। कभी-कभी कुछ मिनट देर से आ सकता है।",
  "ob.purpose": "आप किसलिए पढ़ रहे हैं?", "ob.purpose.EXAM": "🎯 प्रतियोगी परीक्षा", "ob.purpose.SCHOOL": "🏫 स्कूल / कॉलेज", "ob.purpose.SELF": "🌱 सेल्फ डेवलपमेंट", "ob.purpose.SKILL": "🛠 कोई स्किल सीखना",
  "ob.pickExam": "अपना एग्ज़ाम चुनें", "ob.pickGoal": "आपका लक्ष्य", "ob.notListed": "मेरा एग्ज़ाम/लक्ष्य लिस्ट में नहीं है: अपना सिलेबस बनाएँ", "ob.notListedHint": "अपने विषय, किताब और चैप्टर खुद लिखें। कभी भी बदल सकते हैं।",
  "ob.examDate": "एग्ज़ाम की तारीख", "ob.targetDate": "लक्ष्य की तारीख (कब तक पूरा करना है?)",
  "ob.custom.title": "आपका अपना सिलेबस", "ob.custom.goal": "एग्ज़ाम या लक्ष्य का नाम", "ob.custom.goalPlaceholder": "जैसे UP Police Constable, 12वीं बोर्ड, Excel सीखना",
  "ob.custom.subject": "विषय", "ob.custom.subjectPlaceholder": "विषय का नाम, जैसे Physics", "ob.custom.book": "किताब", "ob.custom.bookPlaceholder": "किस किताब से पढ़ रहे हैं (वैकल्पिक), जैसे NCERT 12वीं",
  "ob.custom.chapters": "चैप्टर", "ob.custom.chaptersPlaceholder": "चैप्टर, हर लाइन में एक (वैकल्पिक; बाद में भी जोड़ सकते हैं)\nजैसे\nविद्युत आवेश\nविद्युत धारा",
  "ob.custom.addSubject": "एक और विषय जोड़ें", "ob.custom.later": "विषय और चैप्टर बाद में 📚 मेरा सिलेबस में जोड़, बदल या हटा सकते हैं।", "ob.custom.create": "मेरा सिलेबस सेव करें",
  "ob.custom.needGoal": "कृपया एग्ज़ाम या लक्ष्य का नाम लिखें।", "ob.custom.needSubject": "कम से कम एक विषय जोड़ें।",
  "syl.title": "मेरा सिलेबस", "syl.chaptersDone": "चैप्टर पूरे", "syl.change": "एग्ज़ाम/लक्ष्य बदलें",
  "syl.hintEditable": "यह आपका अपना सिलेबस है। नाम पर टैप करके बदलें, किसी भी क्रम में चैप्टर जोड़ें, और गोले पर टैप करके प्रगति मार्क करें: ○ → ◐ → ✓।",
  "syl.hintReady": "यह तैयार सिलेबस है। गोले पर टैप करके प्रगति मार्क करें: ○ शुरू नहीं → ◐ पढ़ रहे हैं → ✓ पूरा। अपने चैप्टर और किताब चाहिए? “एग्ज़ाम/लक्ष्य बदलें” दबाकर अपना बनाएँ।",
  "syl.empty": "अभी कोई विषय नहीं", "syl.confirmDeleteSubject": "यह विषय और इसके सारे चैप्टर हटाएँ?", "syl.confirmDeleteChapter": "यह चैप्टर हटाएँ?",
  "syl.NOT_STARTED": "शुरू नहीं", "syl.IN_PROGRESS": "पढ़ रहे हैं", "syl.COMPLETED": "पूरा", "syl.added": "{n} चैप्टर जोड़े गए।", "syl.addChapters": "चैप्टर जोड़ें (हर लाइन में एक)",
  "install.title": "RozPadh इंस्टॉल करें", "install.button": "ऐप इंस्टॉल करें", "install.bannerTitle": "RozPadh ऐप पाएँ", "install.bannerText": "होम स्क्रीन से पूरी स्क्रीन पर खुलता है, बिना इंटरनेट भी चलता है, रिमाइंडर भेजता है।",
  "install.ios1": "Safari में नीचे Share बटन ⬆️ दबाएँ।", "install.ios2": "नीचे स्क्रॉल करके “Add to Home Screen” दबाएँ।", "install.ios3": "“Add” दबाएँ। अब होम स्क्रीन से RozPadh खोलें।",
  "install.android1": "यह पेज Chrome में खोलें।", "install.android2": "ऊपर दाईं ओर ⋮ मेनू दबाएँ।", "install.android3": "“Install app” या “Add to Home screen” दबाएँ।",
  "install.note": "यह आम ऐप की तरह इंस्टॉल होता है: अपना आइकन, पूरी स्क्रीन और सूचनाएँ, और बहुत कम जगह लेता है।",
  "install.inapp": "आपने यह लिंक किसी दूसरे ऐप (जैसे WhatsApp या Instagram) के अंदर खोला है। वहाँ से ऐप इंस्टॉल नहीं होता, इसलिए पहले इसे ब्राउज़र में खोलें।",
  "install.openChrome": "Chrome में खोलें", "install.inappManual": "अगर ऐसे न खुले: ऊपर दाईं ओर ⋮ दबाएँ → “Open in browser” / “Open in Chrome”, फिर “Install app” दबाएँ।",
  "install.inappIos": "••• या कम्पास आइकन दबाएँ → “Open in Safari”। फिर Share ⬆️ → “Add to Home Screen”।",
  "install.samsung1": "नीचे ≡ मेनू दबाएँ।", "install.samsung2": "“Add page to” → “Home screen” (या “Install”) दबाएँ।",
  "tests.personalTitle": "आपका अपना सिलेबस", "tests.personalText": "तैयार मॉक टेस्ट सिर्फ लिस्ट वाले एग्ज़ाम के लिए हैं। अपनी पढ़ाई ⏱ टाइमर, 📚 मेरा सिलेबस, 📅 हाज़िरी और ⏰ अलार्म से ट्रैक करें।",
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
