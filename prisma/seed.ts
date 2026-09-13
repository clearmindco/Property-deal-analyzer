import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEMO_ADDRESS, DEMO_FINANCING, DEMO_PURCHASE_PRICE, DEMO_REHAB, DEMO_RENT,
  DEMO_REQUIREMENTS, DEMO_VALUE_ARV,
} from "../src/lib/demoData";
import { defaultDealKillers } from "../src/lib/dealDefaults";
import { DEAL_JSON_FIELDS, COURSE_RULE_JSON_FIELDS, serializeJsonFields } from "../src/lib/jsonFields";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@propertydealanalyzer.com";
const DEMO_PASSWORD = "demodemo123";

// CFP course-source facts as Javier provided them, verbatim. Two source versions of the
// Facebook "5/5/30" cadence conflict with each other -- both are stored, neither is chosen as
// authoritative here. See src/lib/ops/cmoMarketingToday.ts for how this is read.
async function seedCourseRules(userId: string) {
  const existing = await prisma.courseRule.findMany({ where: { userId } });
  if (existing.length > 0) {
    console.log(`${existing.length} CourseRule row(s) already exist, skipping.`);
    return;
  }

  const rows = [
    {
      userId,
      key: "FACEBOOK_5_5_30",
      sourceLabel: "CFP Facebook Tracker / Onboarding",
      ruleText: "Post in 5 groups, 5 days a week for 30 days.",
      details: [
        "Join approximately 5 local, non-real-estate Facebook groups per day.",
        "Season/engage in groups before posting the Blue Ad.",
        "Group engagement can include normal community interaction such as recommendations, questions, polls, etc.",
        "The coach referenced the 5/5/30 tracker as “post in 5 groups 5 days a week.”",
        "No exact numeric seasoning threshold such as X comments or X days was provided in the source material we currently have.",
      ],
      status: "NEEDS_CLARIFICATION",
    },
    {
      userId,
      key: "FACEBOOK_5_5_30",
      sourceLabel: "Earlier Course Roadmap",
      ruleText: "5 Blue Ads in 5 groups per day for 30 days.",
      details: [
        "Differs from the tracker/onboarding version because it can be interpreted as posting every day rather than 5 days per week.",
      ],
      status: "NEEDS_CLARIFICATION",
    },
    {
      userId,
      key: "FACEBOOK_BLUE_AD_WORDING",
      sourceLabel: "CFP Onboarding",
      ruleText: "Hey, does anyone have a property that's not market ready? I'm looking to buy one in the next 2 to 3 weeks.",
      details: [
        "Onboarding guidance said not to change the wording.",
        "Onboarding suggested typing it manually rather than copy/paste, based on their experience with Facebook spam controls.",
        "This spam-control observation is CFP onboarding guidance, not a guaranteed Facebook platform rule.",
      ],
      status: "NEEDS_CLARIFICATION",
    },
  ];

  for (const row of rows) {
    const data = serializeJsonFields(row, COURSE_RULE_JSON_FIELDS);
    await prisma.courseRule.create({ data: data as Prisma.CourseRuleCreateInput });
  }
  console.log(`Seeded ${rows.length} CourseRule rows (both 5/5/30 source versions + Blue Ad wording).`);
}

async function main() {
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    user = await prisma.user.create({
      data: { email: DEMO_EMAIL, passwordHash, name: "Demo Investor" },
    });
    console.log(`Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  }

  await seedCourseRules(user.id);

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
