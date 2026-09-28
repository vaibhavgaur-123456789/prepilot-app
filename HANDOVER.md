# RozPadh (pehle PrepPilot): aage badlav kaise karein (chat khatam hone ke baad)

Poora code GitHub repo `preppilot` mein hai, aur app Vercel pe live hai.
**GitHub ke `main` branch pe jo bhi naya code aata hai, Vercel use ~2 minute mein apne-aap live kar deta hai.**
`CLAUDE.md` file har naye Claude session ko poora project samjha deti hai, isliye kahin se bhi naya chat shuru karke seedha kaam bata sakte ho.

---

## Tareeka 1: Isi computer se (sabse aasaan)
1. **Claude desktop app** kholo → **Code** tab.
2. Folder chuno: `C:\Users\hp\Documents\PrepPilot`
3. Hindi/Hinglish mein likho kya chahiye. Jaise:
   - *"Home screen pe aaj ka quote dikhao"*
   - *"Tests mein ek naya CUET exam jodo"*
   - *"Complaints mein user ka phone number bhi lo"*
4. Kaam hone ke baad likho: **"test karke GitHub pe push kar do"**. 2 minute mein live.

## Tareeka 2: Kisi bhi device se (phone, dusra laptop)
1. **https://claude.ai/code** kholo aur apne Claude account se login karo.
2. Pehli baar: **GitHub connect** karo aur `preppilot` repo ko access do.
3. Repo `preppilot` chuno aur kaam likho, jaise Tareeka 1 mein.
4. Claude badlav karke ek *Pull Request* banayega. GitHub pe **Merge** dabate hi app live ho jayegi.

## Tareeka 3: Bina code ke (Admin panel)
Live app mein apne admin email se login karo → menu mein **⚙️ Admin**:
- **Complaints**: users ki shikayatein padho, jawab do, "Resolve" karo
- **Add a new exam**: naya exam, subjects, topics, questions, tests
- Topics ki importance/difficulty badlo, galat question theek karo ya hatao
- App ke numbers: kitne students, kitne active, planned vs actual

## Agar kuch galat ho jaye
- **Nayi update se app bigad gayi:** Vercel → project → **Deployments** → pichla sahi wala → ⋯ → **Promote to Production**. Purana version turant wapas aa jayega.
- **Claude ko bolo:** *"live app mein X kaam nahi kar raha, Vercel ke logs dekh ke theek karo"*. Logs Vercel → project → **Logs** mein milte hain.

## Zaroori jagahein (bookmark kar lo)
| Kya | Kahan |
|---|---|
| Code | github.com → aapka `preppilot` repo |
| Live app aur settings/secrets | vercel.com → `preppilot` project |
| Database | supabase.com → `preppilot` project |
| Claude se edit (kahin se bhi) | claude.ai/code |

## Suraksha
- `.env.vercel` aur `.env` files mein secret keys hain. Inhe kisi ko mat bhejna, kahin upload mat karna.
- GitHub, Vercel aur Supabase ke passwords alag aur mazboot rakho, aur **2-step verification** on karo.
