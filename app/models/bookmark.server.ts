import { prisma } from "~/db.server";

import type { Bookmark, User } from "@prisma/client";

export async function createBookmark(
  bookmark: Omit<
    Bookmark,
    "id" | "createdAt" | "updatedAt" | "timesOpened" | "timesLiked"
  >
) {
  return prisma.bookmark.create({ data: bookmark });
}

export async function deleteBookmark(id: Bookmark["id"]) {
  return prisma.bookmark.deleteMany({
    where: { id },
  });
}

export async function addTagToBookmark(id: Bookmark["id"], tag: string) {
  const bookmark = await prisma.bookmark.findUnique({ where: { id } });
  if (bookmark?.tags.includes(tag)) return;

  return prisma.bookmark.update({
    where: { id },
    data: { tags: { push: tag } },
  });
}

export async function deleteTagToBookmark(id: Bookmark["id"], tag: string) {
  const bookmark = await prisma.bookmark.findUnique({ where: { id } });

  return prisma.bookmark.update({
    where: { id },
    data: { tags: bookmark?.tags.filter((t) => t !== tag) },
  });
}

export async function getUserBookmarks(userId: User["id"]) {
  return prisma.bookmark.findMany({ where: { userId } });
}
