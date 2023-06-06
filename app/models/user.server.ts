import { prisma } from "~/db.server";

import type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByGoogleId(googleId: User["googleId"]) {
  return prisma.user.findUnique({ where: { googleId } });
}

export async function createUser(
  username: string,
  googleId: string,
  picture: string
) {
  return prisma.user.create({
    data: {
      username,
      googleId,
      picture,
      followedByIDs: [],
      followingIDs: [],
    },
  });
}
