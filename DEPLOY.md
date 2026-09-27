# PrepPilot ko live kaise karein (step-by-step)

Is guide ke end mein aapki app ek public link pe chalegi (jaise `preppilot.vercel.app`). Koi bhi use khol kar **phone pe install** kar sakega, aur aap jab chahein badlav kar sakenge.

Kul kharcha: **₹0** (sab free plans). Play Store pe daalna ho to Google ki ek baar ki fees $25 lagti hai (optional, Step 8).

---

## Step 1: GitHub pe code rakhein (5 min)
1. https://github.com pe login karein.
2. **New repository** → naam `preppilot` → **Private** chunein → *Create*. README mat jodna.
3. Repo ka URL copy karein (jaise `https://github.com/aapka-naam/preppilot.git`).
4. Claude Code mein boliye: *"is URL pe code push karo"*. Ya khud `PrepPilot` folder mein chalayein:
   ```bash
   git remote add origin https://github.com/aapka-naam/preppilot.git
   git push -u origin main
   ```

> Ye repo aapki website wale repo se bilkul alag hai.

## Step 2: Online database (Supabase, 5 min)
1. https://supabase.com → aapka account pehle se hai → **New project** → naam `preppilot`, region **Mumbai (ap-south-1)**. Ek database password banayein aur kahin surakshit likh lein.
2. Project banne ke baad: **Connect** (upar) → **ORMs → Prisma**. Wahan do URL milenge:
   - `DATABASE_URL`: port **6543** wala (pooler)
   - `DIRECT_URL`: port **5432** wala
   Dono copy kar lein, aur `[YOUR-PASSWORD]` ki jagah apna password daal dein.

## Step 3: Vercel pe app daalein (10 min)
1. https://vercel.com → **Sign up with GitHub**.
2. **Add New → Project** → `preppilot` repo **Import** karein.
3. **Environment Variables**: sabse aasaan tarika ye hai ki `PrepPilot` folder ki **`.env.vercel`** file kholo (Notepad mein). Usme saari secret values pehle se bhari hain. Bas 3 lines (`FILL-ME`) mein Supabase ke dono URL aur apna Vercel link bharo, phir poora text copy karke Vercel ke "Key" box mein paste kar do. Vercel khud alag-alag kar dega.

   Neeche har value ka matlab hai:

| Naam | Value |
|---|---|
| `DATABASE_URL` | Step 2 wala 6543 URL |
| `DIRECT_URL` | Step 2 wala 5432 URL |
| `AUTH_SECRET` | ek lamba random text (Claude Code se boliye: "naya AUTH_SECRET banao") |
| `APP_URL` | abhi `https://preppilot.vercel.app` likhein, deploy ke baad asli URL se badal dein |
| `ADMIN_EMAILS` | aapka email (isse signup karte hi aap **admin** ban jayenge) |
| `CRON_SECRET` | ek aur random text |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | apni local `.env` file se copy karein |
| `VAPID_PRIVATE_KEY` | apni local `.env` file se copy karein |
| `VAPID_SUBJECT` | `mailto:aapka-email` |
| `FEEDBACK_EMAIL` | aapka email (complaints yahan aayengi) |
| `RESEND_API_KEY` | *(optional)* Step 6 dekhein |
| `ANTHROPIC_API_KEY` | *(optional)* AI coach ke liye, Step 7 dekhein |

4. **Deploy** dabayein. Build apne-aap `npm run build:prod` chalayega aur database tables bana dega.

## Step 4: Exams aur questions database mein daalein (ek baar)
Apne computer pe `PrepPilot` folder mein (PowerShell):
```bash
$env:DATABASE_URL="Step 2 wala 6543 URL"; $env:DIRECT_URL="Step 2 wala 5432 URL"; npm run seed:prod
```
Isse 3 exams, 886 questions aur mock tests online database mein aa jayenge. Demo accounts **nahi** bante.

Iske baad apne computer wali local app ke liye ek baar ye chalayein (warna local app online database dhoondhegi):
```bash
npx prisma generate
```

## Step 5: Khud ko admin banayein
1. Live link kholein → **Create account** → wahi email use karein jo `ADMIN_EMAILS` mein daala tha.
2. Menu mein **⚙️ Admin** dikhega. Wahan:
   - **Complaints & feedback**: users ki har shikayat
   - Exams, topics, questions ko edit/add karna
   - App ke numbers (kitne students, retention wagairah)
3. Agar signup pehle kar liya tha: `npm run make-admin -- aapka-email` (Step 4 jaise DATABASE_URL set karke).

## Step 6: Complaint email pe bhi paayein (optional, free)
Har complaint **Admin → Complaints** mein hamesha aati hai. Email pe bhi chahiye to:
1. https://resend.com → free account → **API Keys → Create** → key copy karein.
2. Vercel → Project → Settings → Environment Variables → `RESEND_API_KEY` daalein → **Redeploy**.

## Step 7: AI coach Claude se (optional)
1. https://console.anthropic.com → API key banayein (paid usage).
2. Vercel mein `ANTHROPIC_API_KEY` daalein → Redeploy.
Key ke bina bhi coach chalta hai (built-in, aapke data se jawab deta hai).

## Step 8: Notifications har ghante (recommended, free)
Vercel ka free plan din mein sirf ek baar cron chalata hai (subah ~7 baje ka briefing). Har ghante ke reminders ke liye:
1. https://cron-job.org → free account → **Create cronjob**.
2. URL: `https://aapka-link/api/v1/cron/notifications`, schedule: **every hour**.
3. **Advanced → Headers**: `Authorization` = `Bearer <aapka CRON_SECRET>`.

Students ko **Profile → Notifications → "इस डिवाइस पर सूचनाएँ चालू करें"** dabana hoga. Tab app band hone par bhi reminder aayenge.

## Step 9: Log app kaise "download" karenge
App ek **PWA** hai, yani website jo phone pe app ki tarah install hoti hai:
- **Android (Chrome):** link kholo → menu ⋮ → **Install app / Add to Home screen**.
- **iPhone (Safari):** link kholo → Share ⬆️ → **Add to Home Screen**. iPhone pe push notifications ke liye ye zaroori hai.
- **Computer (Chrome/Edge):** address bar mein install ⊕ icon.

**Play Store pe daalna ho (optional):**
1. https://www.pwabuilder.com → apna live link daalein → **Package for stores → Android** → package download.
2. https://play.google.com/console → developer account ($25 ek baar) → nayi app → wo package upload karein.

## Aage badlav kaise karein
- **Questions, topics, exams:** Admin panel se, bina code ke, turant.
- **App mein koi naya feature ya badlav:** `PrepPilot` folder Claude Code mein kholo aur bolo kya chahiye. Phir `git push`, aur Vercel 2 minute mein apne-aap live kar deta hai.
- **Kuch galat ho jaye:** Vercel → Deployments → pichla wala → **Promote to Production** (turant purana version wapas).

## Zaroori suraksha baatein
- `.env` file aur keys kabhi GitHub pe mat daalein (`.gitignore` already rokta hai).
- `AUTH_SECRET` badalne se sab log logout ho jayenge.
- Supabase ka database password aur Vercel ka login surakshit rakhein. Inse poori app control hoti hai.
