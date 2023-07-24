import { json } from "@remix-run/node";

import type { Bookmark, User } from "@prisma/client";

import {
  addBookmarkTimesOpened,
  addBookmarkToHangar,
} from "~/models/bookmark.server";

export async function addTimesOpened(bookmarkId: Bookmark["id"]) {
  await addBookmarkTimesOpened(bookmarkId);
  return json({ status: 200 });
}

export async function addToHangar(
  bookmarkId: Bookmark["id"],
  userId: User["id"]
) {
  try {
    const [{ title }] = await addBookmarkToHangar(bookmarkId, userId);
    return json({ status: 200, message: `${title} added` });
  } catch (error) {
    if (error instanceof Error && error.message === "Bookmark already exists") {
      return json({ status: 500, message: "Bookmark already added" });
    }
    return json({ status: 500, message: "Something went wrong" });
  }
}
