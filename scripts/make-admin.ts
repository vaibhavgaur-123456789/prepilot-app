// Give an existing account the admin role:  npm run make-admin -- you@example.com
import { PrismaClient } from "@prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run make-admin -- you@example.com");
  process.exit(1);
}
const prisma = new PrismaClient();
prisma.user
  .update({ where: { email }, data: { role: "ADMIN" } })
  .then((u) => console.log(`${u.email} is now an admin. Open /admin after signing in.`))
  .catch(() => {
    console.error(`No account found for ${email}. Sign up in the app first, then run this again.`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
