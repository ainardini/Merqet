const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const mei = await prisma.user.upsert({
    where: { email: "mei@university.edu" },
    update: {},
    create: { email: "mei@university.edu", name: "Mei L.", passwordHash, campus: "State University" },
  });
  const arjun = await prisma.user.upsert({
    where: { email: "arjun@university.edu" },
    update: {},
    create: { email: "arjun@university.edu", name: "Arjun P.", passwordHash, campus: "State University" },
  });

  await prisma.listing.createMany({
    data: [
      {
        title: "Organic Chemistry 4th Ed. (barely cracked)",
        description: "Used for one semester, no highlighting, all pages intact.",
        category: "Textbooks", condition: "Good", price: 25, emoji: "📚", sellerId: mei.id,
      },
      {
        title: "TI-84 Plus calculator",
        description: "Works perfectly, comes with the case.",
        category: "Electronics", condition: "Like new", price: 35, emoji: "🧮", sellerId: mei.id,
      },
      {
        title: "IKEA desk, some scratches, still solid",
        description: "Great for a dorm room, easy to disassemble for moving.",
        category: "Furniture", condition: "Fair", price: 40, emoji: "🪑", sellerId: arjun.id,
      },
      {
        title: "Mini fridge, works great, loud-ish",
        description: "Perfect size for a dorm, a bit noisy at night.",
        category: "Dorm", condition: "Good", price: 30, emoji: "🧊", sellerId: arjun.id,
      },
    ],
  });

  console.log("Seeded! Test logins:");
  console.log("  mei@university.edu / password123");
  console.log("  arjun@university.edu / password123");
}

main().finally(() => prisma.$disconnect());
