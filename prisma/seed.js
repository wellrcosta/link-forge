"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const existingPlan = await prisma.plan.findFirst({ where: { isDefault: true } });
    if (!existingPlan) {
        await prisma.plan.create({
            data: {
                name: 'FREE',
                maxLinks: 10,
                maxTotalClicks: 10_000_000,
                maxClicksPerLink: 1_000_000,
                createLinkRateLimit: 30,
                redirectRateLimit: 500,
                isDefault: true,
            },
        });
        console.log('Default FREE plan created.');
    }
    else {
        console.log('Default plan already exists, skipping seed.');
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map