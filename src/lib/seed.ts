import type { PrismaClient } from "@/generated/prisma/client";
import { Priority, Role, TicketStatus } from "@/generated/prisma/enums";
import { hashPassword } from "@/lib/auth/password";

/**
 * Shared, idempotent demo-data seeder. Used by both the CLI seed script
 * (`npm run db:seed`) and the agent-only reseed endpoint. Wipes existing data
 * and recreates the deterministic sample set from the product design.
 *
 * All demo accounts share this password (documented in the README); the two
 * emails below back the "Enter as Agent / Customer" quick-login buttons.
 */
export const DEMO_PASSWORD = "Password123!";
export const DEMO_AGENT_EMAIL = "jordan.vega@xenfi.com";
export const DEMO_CUSTOMER_EMAIL = "marcus.reyes@northgate.media";

export type SeedSummary = {
  users: number;
  agents: number;
  customers: number;
  tags: number;
  tickets: number;
  comments: number;
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

type TicketSpec = {
  number: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  customer: string; // by name
  agent: string | null; // by name, null = unassigned
  tags: string[];
  createdAgo: number;
  updatedAgo: number;
  thread?: { author: string; body: string; ago: number }[];
};

export async function seedDatabase(prisma: PrismaClient): Promise<SeedSummary> {
  const now = Date.now();
  const at = (ago: number) => new Date(now - ago);

  // Clear in FK-safe order.
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // --- Agents --------------------------------------------------------------
  const agentSpecs = [
    { name: "Jordan Vega", email: DEMO_AGENT_EMAIL },
    { name: "Priya Nair", email: "priya.nair@xenfi.com" },
    { name: "Daniel Okoro", email: "daniel.okoro@xenfi.com" },
    { name: "Marcus Lee", email: "marcus.lee@xenfi.com" },
  ];
  const agents = new Map<string, { id: string }>();
  for (const a of agentSpecs) {
    const u = await prisma.user.create({
      data: { name: a.name, email: a.email, passwordHash, role: Role.AGENT },
    });
    agents.set(a.name, u);
  }

  // --- Customers -----------------------------------------------------------
  const customerSpecs = [
    { name: "Marcus Reyes", email: DEMO_CUSTOMER_EMAIL, company: "Northgate Media" },
    { name: "Elena Fischer", email: "elena.fischer@brightwave.io", company: "Brightwave Retail" },
    { name: "Tomás Vidal", email: "tomas.vidal@vidalco.com", company: "Vidal & Co" },
    { name: "Aisha Bello", email: "aisha.bello@lumenhealth.com", company: "Lumen Health" },
    { name: "Liang Wei", email: "liang.wei@skyforge.dev", company: "Skyforge Labs" },
    { name: "Sofia Marchetti", email: "sofia.marchetti@marchetti.studio", company: "Marchetti Studio" },
  ];
  const customers = new Map<string, { id: string }>();
  for (const c of customerSpecs) {
    const u = await prisma.user.create({
      data: { name: c.name, email: c.email, passwordHash, role: Role.CUSTOMER, company: c.company },
    });
    customers.set(c.name, u);
  }

  const userId = (name: string) => (customers.get(name) ?? agents.get(name))!.id;

  // --- Tags ----------------------------------------------------------------
  const tagSpecs = [
    { name: "Billing", color: "#B45309" },
    { name: "Network", color: "#0369A1" },
    { name: "Account", color: "#7C3AED" },
    { name: "Hardware", color: "#BE185D" },
    { name: "API", color: "#0F766E" },
  ];
  const tags = new Map<string, { id: string }>();
  for (const t of tagSpecs) {
    const tag = await prisma.tag.create({ data: t });
    tags.set(t.name, tag);
  }

  // --- Tickets -------------------------------------------------------------
  const ack =
    "Thanks for the details — I've picked this up and I'm investigating now. I'll follow up shortly with an update.";

  const ticketSpecs: TicketSpec[] = [
    {
      number: 1042,
      title: "Fiber link dropping every few minutes",
      description:
        "Since this morning my fiber link drops for about 30 seconds every few minutes. It's making video calls unusable. Modem lights look normal and a reboot didn't help.",
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      customer: "Marcus Reyes",
      agent: "Priya Nair",
      tags: ["Network", "Hardware"],
      createdAgo: 2 * HOUR,
      updatedAgo: 12 * MIN,
      thread: [
        { author: "Marcus Reyes", ago: 2 * HOUR, body: "Since this morning my fiber link drops for about 30 seconds every few minutes. It's making video calls unusable. Modem lights look normal and a reboot didn't help." },
        { author: "Priya Nair", ago: 1 * HOUR, body: "Thanks Marcus — I can see repeated re-syncs on your line from our side. Can you confirm whether the drops happen on Wi-Fi only, or on a wired connection too?" },
        { author: "Marcus Reyes", ago: 48 * MIN, body: "It happens on wired as well — Ethernet straight into the ONT, same behaviour." },
        { author: "Priya Nair", ago: 12 * MIN, body: "Understood. I've escalated this to the field team and booked a line test for this afternoon between 2–4pm. I'll keep this ticket updated — marking it In Progress in the meantime." },
      ],
    },
    {
      number: 1041,
      title: "Overcharged on May invoice",
      description:
        "My May invoice shows $148 but my plan is $89/month with no add-ons — looks like I was billed twice for the static IP. Can someone review and refund the difference?",
      status: TicketStatus.OPEN,
      priority: Priority.HIGH,
      customer: "Elena Fischer",
      agent: null,
      tags: ["Billing"],
      createdAgo: 40 * MIN,
      updatedAgo: 34 * MIN,
    },
    {
      number: 1039,
      title: "Static IP allocation request",
      description:
        "We're deploying a new mail server and need a dedicated static IPv4 address allocated to our account. Could you advise on timeline and any extra cost?",
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      customer: "Tomás Vidal",
      agent: "Daniel Okoro",
      tags: ["Network", "Account"],
      createdAgo: 3 * HOUR,
      updatedAgo: 1 * HOUR,
    },
    {
      number: 1037,
      title: "Password reset email not arriving",
      description:
        "I've requested a password reset three times but the email never arrives — checked spam too. I'm completely locked out of the customer portal.",
      status: TicketStatus.OPEN,
      priority: Priority.MEDIUM,
      customer: "Aisha Bello",
      agent: null,
      tags: ["Account"],
      createdAgo: 2 * HOUR,
      updatedAgo: 2 * HOUR,
    },
    {
      number: 1035,
      title: "API returning 429 rate-limit errors",
      description:
        "Our integration started getting HTTP 429 responses around 9am despite being well under the documented limit. Has the rate limit changed recently?",
      status: TicketStatus.OPEN,
      priority: Priority.HIGH,
      customer: "Liang Wei",
      agent: "Priya Nair",
      tags: ["API"],
      createdAgo: 4 * HOUR,
      updatedAgo: 3 * HOUR,
    },
    {
      number: 1031,
      title: "Router firmware update failed",
      description:
        "The firmware update on our XF-720 router failed midway and now it won't get past the boot light. We have no connectivity.",
      status: TicketStatus.RESOLVED,
      priority: Priority.MEDIUM,
      customer: "Sofia Marchetti",
      agent: "Daniel Okoro",
      tags: ["Hardware"],
      createdAgo: 1 * DAY,
      updatedAgo: 5 * HOUR,
    },
    {
      number: 1028,
      title: "Upload speeds far below plan",
      description:
        "We're paying for the 500/500 plan but upload tests show around 80 Mbps consistently across every device, wired or wireless.",
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.LOW,
      customer: "Marcus Reyes",
      agent: "Priya Nair",
      tags: ["Network"],
      createdAgo: 2 * DAY,
      updatedAgo: 1 * DAY,
    },
    {
      number: 1024,
      title: "Add three users to organization",
      description:
        "Please add three teammates to our organization with agent-level access: Sam Cole, Dana Reed and Theo Park.",
      status: TicketStatus.RESOLVED,
      priority: Priority.LOW,
      customer: "Elena Fischer",
      agent: "Daniel Okoro",
      tags: ["Account"],
      createdAgo: 2 * DAY,
      updatedAgo: 1 * DAY,
    },
    {
      number: 1019,
      title: "Webhook deliveries delayed",
      description:
        "Webhook events are arriving 5–10 minutes late, which is breaking our order sync. This started yesterday afternoon.",
      status: TicketStatus.OPEN,
      priority: Priority.MEDIUM,
      customer: "Liang Wei",
      agent: null,
      tags: ["API", "Network"],
      createdAgo: 2 * DAY,
      updatedAgo: 2 * DAY,
    },
    {
      number: 1012,
      title: "Refund for duplicate June payment",
      description:
        "I was charged twice for my June payment because of a retry. Requesting a refund for the duplicate $89.00 charge.",
      status: TicketStatus.RESOLVED,
      priority: Priority.LOW,
      customer: "Aisha Bello",
      agent: "Priya Nair",
      tags: ["Billing"],
      createdAgo: 4 * DAY,
      updatedAgo: 3 * DAY,
    },
    {
      number: 1003,
      title: "Update billing address on account",
      description:
        "Please update the billing address on our account to 220 Harbor Ave, Suite 4, Portland.",
      status: TicketStatus.RESOLVED,
      priority: Priority.LOW,
      customer: "Marcus Reyes",
      agent: "Daniel Okoro",
      tags: ["Billing"],
      createdAgo: 7 * DAY,
      updatedAgo: 7 * DAY,
    },
  ];

  let commentCount = 0;
  for (const spec of ticketSpecs) {
    // Build the thread: explicit if provided, else opening message (+ agent ack).
    const thread =
      spec.thread ??
      [
        { author: spec.customer, body: spec.description, ago: spec.createdAgo },
        ...(spec.agent ? [{ author: spec.agent, body: ack, ago: spec.updatedAgo }] : []),
      ];

    await prisma.ticket.create({
      data: {
        number: spec.number,
        title: spec.title,
        description: spec.description,
        status: spec.status,
        priority: spec.priority,
        customerId: userId(spec.customer),
        agentId: spec.agent ? userId(spec.agent) : null,
        createdAt: at(spec.createdAgo),
        updatedAt: at(spec.updatedAgo),
        tags: { connect: spec.tags.map((name) => ({ id: tags.get(name)!.id })) },
        comments: {
          create: thread.map((c) => ({
            body: c.body,
            authorId: userId(c.author),
            createdAt: at(c.ago),
          })),
        },
      },
    });
    commentCount += thread.length;
  }

  // Keep the autoincrement sequence ahead of the explicit demo numbers so
  // tickets created through the app continue from the highest seeded code.
  await prisma.$queryRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Ticket"', 'number'), (SELECT MAX(number) FROM "Ticket"))`,
  );

  return {
    users: agentSpecs.length + customerSpecs.length,
    agents: agentSpecs.length,
    customers: customerSpecs.length,
    tags: tagSpecs.length,
    tickets: ticketSpecs.length,
    comments: commentCount,
  };
}
