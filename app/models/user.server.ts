import { prisma } from "~/db.server";

import type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByGoogleId(googleId: User["googleId"]) {
  return prisma.user.findUnique({ where: { googleId } });
}

export async function isFollowing(
  followerId: User["id"],
  followingId: User["id"]
) {
  const follower = await prisma.user.findUnique({
    where: { id: followerId },
    include: { following: true },
  });

  if (!follower) {
    throw new Error(`Follower with ID ${followerId} not found.`);
  }

  const followingUserIds = follower.following.map((user) => user.id);
  return followingUserIds.includes(followingId);
}

export async function followUser(
  followerId: User["id"],
  followingId: User["id"]
) {
  const updateFollower = prisma.user.update({
    where: { id: followerId },
    data: { followingIDs: { push: followingId } },
  });

  const updateFollowed = prisma.user.update({
    where: { id: followingId },
    data: { followedByIDs: { push: followerId } },
  });

  return prisma.$transaction([updateFollower, updateFollowed]);
}

export async function unfollowUser(
  followerId: User["id"],
  followingId: User["id"]
) {
  const follower = await prisma.user.findUnique({
    where: { id: followerId },
    include: { following: true },
  });
  const followed = await prisma.user.findUnique({
    where: { id: followingId },
    include: { followedBy: true },
  });

  if (!follower || !followed) {
    throw new Error(
      `Follower with ID ${followerId} or ID ${followingId} not found.`
    );
  }

  const updateFollower = prisma.user.update({
    where: { id: followerId },
    data: {
      followingIDs: {
        set: follower.following
          .map((f) => f.id)
          .filter((f) => f !== followingId),
      },
    },
  });

  const updateFollowed = prisma.user.update({
    where: { id: followingId },
    data: {
      followedByIDs: {
        set: followed.followedBy
          .map((f) => f.id)
          .filter((f) => f !== followerId),
      },
    },
  });

  return prisma.$transaction([updateFollower, updateFollowed]);
}

export async function createUser(
  username: string,
  email: string,
  googleId: string,
  picture: string
) {
  return prisma.user.create({
    data: {
      username,
      email,
      googleId,
      picture,
      followedByIDs: [],
      followingIDs: [],
    },
  });
}
