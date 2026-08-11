// Grants admin access (the /admin/reports dashboard) to a user by email.
// There's deliberately no self-serve UI for this — admin access should be
// granted deliberately, not toggleable from the app itself.
//
// Usage: node prisma/make-admin.js you@example.com

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node prisma/make-admin.js you@example.com");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { isAdmin: true },
  });

  console.log(`${user.name} (${user.email}) is now an admin. They can visit /admin/reports.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
