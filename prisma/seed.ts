import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEMO_ADDRESS, DEMO_FINANCING, DEMO_PURCHASE_PRICE, DEMO_REHAB, DEMO_RENT,
  DEMO_REQUIREMENTS, DEMO_VALUE_ARV,
} from "../src/lib/demoData";
import { defaultDealKillers } from "../src/lib/dealDefaults";
import { DEAL_JSON_FIELDS, serializeJsonFields } from "../src/lib/jsonFields";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@propertydealanalyzer.com";
const DEMO_PASSWORD = "demodemo123";

async function main() {
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    user = await prisma.user.create({
      data: { email: DEMO_EMAIL, passwordHash, name: "Demo Investor" },
    });
    console.log(`Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  }

  const existingDemoDeal = await prisma.deal.findFirst({ where: { userId: user.id, isDemo: true } });
  if (existingDemoDeal) {
    console.log("Demo deal already exists, skipping.");
    return;
  }

  const dealData = serializeJsonFields(
    {
      userId: user.id,
      isDemo: true,
      stage: "ANALYZING",
      address: DEMO_ADDRESS,
      city: "Rochester",
      state: "NY",
      zip: "14606",
      askingPrice: DEMO_PURCHASE_PRICE,
      propertyType: "Single Family",
      units: 1,
      bedrooms: 3,
      bathrooms: 1.5,
      sqft: 1350,
      valueArv: DEMO_VALUE_ARV,
      rehab: DEMO_REHAB,
      rent: DEMO_RENT,
      financing: DEMO_FINANCING,
      assumptions: DEMO_REQUIREMENTS,
      dealKillers: defaultDealKillers(),
      property: {
        roofAgeYears: { value: 6, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
        furnaceAgeYears: { value: 3, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
        waterHeaterAgeYears: { value: 3, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
        electricalPanelAgeYears: { value: 7, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
        occupancyAtClosing: { value: "VACANT", provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
        annualTaxes: { value: 3500, provenance: { status: "ASSUMPTION", note: "Demo/educational data" } },
      },
    },
    DEAL_JSON_FIELDS
  );

  await prisma.deal.create({ data: dealData as Prisma.DealCreateInput });

  console.log("Seeded DEMO/EDUCATIONAL BRRRR deal.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
