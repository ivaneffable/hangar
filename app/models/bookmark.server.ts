import { prisma } from "~/db.server";

import type { Bookmark, User } from "@prisma/client";

async function isBookmarkAlreadyAdded(userId: string, url: string) {
  const bookmarkExists =
    (
      await prisma.bookmark.findMany({
        where: { userId, url },
      })
    ).length > 0;

  return bookmarkExists;
}

export async function createBookmark(
  bookmark: Omit<
    Bookmark,
    "id" | "createdAt" | "updatedAt" | "timesOpened" | "timesLiked"
  >
) {
  const bookmarkExists = await isBookmarkAlreadyAdded(
    bookmark.userId,
    bookmark.url
  );
  if (bookmarkExists) {
    throw new Error("Bookmark already exists");
  }

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

export async function getUserBookmarks(userId: User["id"], page: number) {
  return prisma.bookmark.findMany({
    include: { user: { select: { username: true } } },
    skip: page * 25,
    take: 25,
    where: { userId },
    orderBy: [
      {
        timesLiked: "desc",
      },
    ],
  });
}

export async function getNeighborhoodBookmarks(
  userId: User["id"],
  page: number
) {
  return prisma.bookmark.findMany({
    include: { user: { select: { username: true } } },
    skip: page * 25,
    take: 25,
    where: { userId: { not: userId } },
    orderBy: [
      {
        timesLiked: "desc",
      },
    ],
  });
}

export async function addBookmarkTimesOpened(id: Bookmark["id"]) {
  return prisma.bookmark.update({
    where: { id },
    data: { timesOpened: { increment: 1 } },
  });
}

export async function addBookmarkToHangar(
  id: Bookmark["id"],
  userId: User["id"]
) {
  const bookmark = await prisma.bookmark.findUnique({
    where: { id },
  });

  if (!bookmark) {
    throw new Error("Bookmark does not exist");
  }

  const bookmarkExists = await isBookmarkAlreadyAdded(userId, bookmark.url);
  if (bookmarkExists) {
    throw new Error("Bookmark already exists");
  }

  const createBookmark = prisma.bookmark.create({
    data: {
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      image: bookmark.image,
      userId,
    },
  });

  const addBookmarkLikes = prisma.bookmark.update({
    where: { id },
    data: { timesLiked: { increment: 1 } },
  });

  return prisma.$transaction([createBookmark, addBookmarkLikes]);
}
