import type { PrismaClient } from "@/generated/prisma/client";
import { Priority, Role, TicketStatus } from "@/generated/prisma/enums";
import { hashPassword } from "@/lib/auth/password";

/**
 * Shared, idempotent demo-data seeder. Used by both the CLI seed script
 * (`npm run db:seed`) and the agent-only reseed endpoint. Wipes existing
 * data and recreates a deterministic sample set so evaluation is easy.
 *
 * All demo accounts share this password (documented in the README).
 */
export const DEMO_PASSWORD = "Password123!";

export type SeedSummary = {
  users: number;
  agents: number;
  customers: number;
  tags: number;
  tickets: number;
  comments: number;
};

export async function seedDatabase(prisma: PrismaClient): Promise<SeedSummary> {
  // Clear in FK-safe order (cascades cover most, but be explicit).
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // --- Users ---------------------------------------------------------------
  const [alice, bob] = await Promise.all([
    prisma.user.create({
      data: { name: "Alice Agent", email: "agent@xendesk.test", passwordHash, role: Role.AGENT },
    }),
    prisma.user.create({
      data: { name: "Bob Agent", email: "bob.agent@xendesk.test", passwordHash, role: Role.AGENT },
    }),
  ]);

  const [carol, dave, erin] = await Promise.all([
    prisma.user.create({
      data: { name: "Carol Customer", email: "customer@xendesk.test", passwordHash, role: Role.CUSTOMER },
    }),
    prisma.user.create({
      data: { name: "Dave Customer", email: "dave@xendesk.test", passwordHash, role: Role.CUSTOMER },
    }),
    prisma.user.create({
      data: { name: "Erin Customer", email: "erin@xendesk.test", passwordHash, role: Role.CUSTOMER },
    }),
  ]);

  // --- Tags ----------------------------------------------------------------
  const tagNames = ["Billing", "Network", "Account", "Bug", "Feature Request"];
  const tags = await Promise.all(
    tagNames.map((name) => prisma.tag.create({ data: { name } })),
  );
  const tag = (name: string) => tags.find((t) => t.name === name)!;

  // --- Tickets (with nested comments) -------------------------------------
  type SeedTicket = {
    title: string;
    description: string;
    status: TicketStatus;
    priority: Priority;
    customerId: string;
    agentId?: string;
    tagNames: string[];
    comments: { authorId: string; body: string }[];
  };

  const ticketSpecs: SeedTicket[] = [
    {
      title: "Cannot log in to my account",
      description: "I keep getting an 'invalid credentials' error even after resetting my password twice.",
      status: TicketStatus.OPEN,
      priority: Priority.HIGH,
      customerId: carol.id,
      tagNames: ["Account"],
      comments: [
        { authorId: carol.id, body: "This started this morning and is blocking my work." },
      ],
    },
    {
      title: "Double charged on my last invoice",
      description: "My September invoice shows two identical charges of $49. Please refund the duplicate.",
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      customerId: dave.id,
      agentId: alice.id,
      tagNames: ["Billing"],
      comments: [
        { authorId: dave.id, body: "Attaching the invoice number: INV-20984." },
        { authorId: alice.id, body: "Thanks Dave — I've confirmed the duplicate and started the refund. It takes 3-5 business days." },
      ],
    },
    {
      title: "Intermittent connection drops",
      description: "The dashboard disconnects every few minutes and I have to refresh to see live data.",
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      customerId: erin.id,
      agentId: bob.id,
      tagNames: ["Network", "Bug"],
      comments: [
        { authorId: erin.id, body: "Happens on both Wi-Fi and wired connections." },
        { authorId: bob.id, body: "Could you share your browser and OS version so I can reproduce?" },
        { authorId: erin.id, body: "Chrome 141 on Windows 11." },
      ],
    },
    {
      title: "Request: export tickets to CSV",
      description: "It would help our team to export the ticket list with filters applied to a CSV file.",
      status: TicketStatus.OPEN,
      priority: Priority.LOW,
      customerId: carol.id,
      tagNames: ["Feature Request"],
      comments: [],
    },
    {
      title: "Password reset email never arrives",
      description: "I've requested a reset link five times and nothing shows up, including in spam.",
      status: TicketStatus.OPEN,
      priority: Priority.MEDIUM,
      customerId: dave.id,
      tagNames: ["Account", "Bug"],
      comments: [],
    },
    {
      title: "Billing address won't update",
      description: "Saving a new billing address silently fails — the old one reappears after refresh.",
      status: TicketStatus.RESOLVED,
      priority: Priority.LOW,
      customerId: erin.id,
      agentId: alice.id,
      tagNames: ["Billing", "Account"],
      comments: [
        { authorId: erin.id, body: "Tried on two browsers, same result." },
        { authorId: alice.id, body: "Fixed — there was a validation bug on the postal code. Please try again." },
        { authorId: erin.id, body: "Works now, thank you!" },
      ],
    },
    {
      title: "API returns 500 on bulk update",
      description: "Updating more than 50 records at once returns a 500 error every time.",
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      customerId: carol.id,
      agentId: bob.id,
      tagNames: ["Bug", "Network"],
      comments: [
        { authorId: bob.id, body: "Reproduced — escalating to engineering with the request payload." },
      ],
    },
    {
      title: "How do I add a teammate?",
      description: "I want to invite a colleague to our workspace but can't find the option.",
      status: TicketStatus.RESOLVED,
      priority: Priority.LOW,
      customerId: dave.id,
      agentId: alice.id,
      tagNames: ["Account"],
      comments: [
        { authorId: alice.id, body: "Settings → Team → Invite. Let me know if that helps!" },
        { authorId: dave.id, body: "Found it, thanks." },
      ],
    },
  ];

  let commentCount = 0;
  for (const spec of ticketSpecs) {
    await prisma.ticket.create({
      data: {
        title: spec.title,
        description: spec.description,
        status: spec.status,
        priority: spec.priority,
        customerId: spec.customerId,
        agentId: spec.agentId ?? null,
        tags: { connect: spec.tagNames.map((name) => ({ id: tag(name).id })) },
        comments: { create: spec.comments },
      },
    });
    commentCount += spec.comments.length;
  }

  return {
    users: 5,
    agents: 2,
    customers: 3,
    tags: tags.length,
    tickets: ticketSpecs.length,
    comments: commentCount,
  };
}
