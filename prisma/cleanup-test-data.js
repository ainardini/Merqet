// One-time pre-launch cleanup: removes the two seed test accounts
// (mei@university.edu, arjun@university.edu — password123, publicly known
// since it's in this repo's own seed.js) and prints every listing currently
// in the database so you can review and delete any leftover test junk.
//
// Deleting a user cascades to their listings, offers, messages, reviews,
// etc. — same as the in-app "Delete account" feature.
//
// Usage: node prisma/cleanup-test-data.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SEED_EMAILS = ["mei@university.edu", "arjun@university.edu"];

async function main() {
  console.log("Removing seed test accounts...\n");

  for (const email of SEED_EMAILS) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`  ${email} — not found, already removed or never seeded here.`);
      continue;
    }
    await prisma.user.delete({ where: { email } });
    console.log(`  Deleted ${email} and everything tied to it (listings, offers, messages, etc.)`);
  }

  console.log("\nRemaining listings in your database — review these for leftover test junk:\n");

  const listings = await prisma.listing.findMany({
    select: { id: true, title: true, status: true, createdAt: true, seller: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (listings.length === 0) {
    console.log("  (none)");
  } else {
    listings.forEach((l) => {
      console.log(`  [${l.status}] "${l.title}" — by ${l.seller.email} — id: ${l.id}`);
    });
    console.log(
      "\nTo delete a specific listing by id, run:\n" +
      '  node -e "require(\'@prisma/client\'); const {PrismaClient}=require(\'@prisma/client\'); ' +
      "const p=new PrismaClient(); p.listing.delete({where:{id:'PASTE_ID_HERE'}}).then(()=>console.log('deleted')).finally(()=>p.$disconnect())\""
    );
  }
}

main().finally(() => prisma.$disconnect());
