import { prisma } from "@/lib/prisma";
import { type Actor, assertAgent } from "@/lib/auth/rbac";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors";
import { type CreateTagInput } from "@/lib/validation/tag";

const tagSelect = {
  id: true,
  name: true,
  color: true,
  _count: { select: { tickets: true } },
} as const;

const DEFAULT_TAG_COLOR = "#667085";

/** Tags are visible to any authenticated user (used to categorise tickets). */
export function listTags() {
  return prisma.tag.findMany({ select: tagSelect, orderBy: { name: "asc" } });
}

/** Agents manage the tag taxonomy. Names are case-insensitively unique. */
export async function createTag(actor: Actor, input: CreateTagInput) {
  assertAgent(actor);
  const name = input.name.trim();

  const existing = await prisma.tag.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) throw new ConflictError(`Tag "${name}" already exists.`);

  return prisma.tag.create({
    data: { name, color: input.color ?? DEFAULT_TAG_COLOR },
    select: tagSelect,
  });
}

export async function deleteTag(actor: Actor, tagId: string) {
  assertAgent(actor);
  const tag = await prisma.tag.findUnique({ where: { id: tagId }, select: { id: true } });
  if (!tag) throw new NotFoundError("Tag not found.");
  await prisma.tag.delete({ where: { id: tagId } });
}

/**
 * Ensures every id refers to a real tag, so ticket create/update fails loudly
 * with a 400 rather than a raw foreign-key error. Returns the validated ids.
 */
export async function assertTagsExist(tagIds: string[]): Promise<string[]> {
  if (tagIds.length === 0) return [];
  const unique = [...new Set(tagIds)];
  const found = await prisma.tag.count({ where: { id: { in: unique } } });
  if (found !== unique.length) {
    throw new BadRequestError("One or more tags do not exist.");
  }
  return unique;
}
