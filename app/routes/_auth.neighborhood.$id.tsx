import { useEffect } from "react";
import {
  useActionData,
  useLoaderData,
  useParams,
  useRouteError,
  useSubmit,
  isRouteErrorResponse,
  Link,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useToast, Flex } from "@chakra-ui/react";
import invariant from "tiny-invariant";

import {
  getUserById,
  isFollowing,
  followUser,
  unfollowUser,
} from "~/models/user.server";
import { getUserBookmarks } from "~/models/bookmark.server";
import { requireUserId } from "~/session.server";
import { addTimesOpened, addToHangar } from "~/utils/bookmarkActions.server";
import { Bookmark } from "~/components/Bookmark";

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);

  const { id } = params;
  invariant(id, "User must be provided");

  const neighbor = await getUserById(id);
  if (!neighbor) {
    throw new Response("User not found.", {
      status: 404,
    });
  }

  const following = userId ? await isFollowing(userId, id) : false;
  const bookmarks = await getUserBookmarks(id, 0);

  return json({
    neighbor: {
      id: neighbor.id,
      username: neighbor.username,
      following,
    },
    bookmarks: bookmarks.map((bookmark) => ({
      id: bookmark.id,
      title: bookmark.title,
      description: bookmark.description,
      image: bookmark.image,
      url: bookmark.url,
      tags: bookmark.tags,
      timesOpened: bookmark.timesOpened,
      timesLiked: bookmark.timesLiked,
    })),
  });
}

export async function action({ params, request }: ActionArgs) {
  const userId = await requireUserId(request);

  const { id } = params;
  invariant(id, "User must be provided");

  const formData = await request.formData();
  const { _action, bookmark } = Object.fromEntries(formData);

  try {
    if (_action === "follow") {
      await followUser(userId, id);
      return json({ status: 200 });
    } else if (_action === "unfollow") {
      await unfollowUser(userId, id);
      return json({ status: 200 });
    }
  } catch (error) {
    return json({ status: 500, message: "Something went wrong" });
  }

  if (typeof bookmark !== "string" || bookmark.length === 0) {
    return json({ status: 500, message: "Something went wrong" });
  }

  if (_action === "addTimesOpened") {
    return await addTimesOpened(bookmark);
  }

  if (_action === "addBookmarkToHangar") {
    return await addToHangar(bookmark, userId);
  }
}

export default function Neighbor() {
  const submit = useSubmit();
  const toast = useToast();
  const { bookmarks, neighbor } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ status: number; message?: string }>();

  useEffect(() => {
    if (actionData?.status === 200 && actionData?.message) {
      toast({
        title: actionData?.message,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    }
    if (actionData?.status === 500) {
      toast({
        title: actionData?.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }, [actionData, toast]);

  return (
    <Flex wrap="wrap" gap="2" justifyContent="start">
      {bookmarks.map((bookmark) => (
        <Bookmark
          key={bookmark.id}
          value={bookmark}
          onOpenDetail={() => {}}
          onOpen={() => {
            submit(
              { _action: "addTimesOpened", bookmark: bookmark.id },
              { method: "POST", action: `/neighborhood/${neighbor.id}` }
            );
          }}
          onLike={() => {
            submit(
              { _action: "addBookmarkToHangar", bookmark: bookmark.id },
              { method: "POST", action: `/neighborhood/${neighbor.id}` }
            );
          }}
        />
      ))}
    </Flex>
  );
}

export function ErrorBoundary() {
  const { id } = useParams();
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <>
        <div>User {id} is not around!</div>
        <Link to="/neighborhood">Back to the hood</Link>
      </>
    );
  }

  return (
    <>
      <div>Something went wrong. Sorry!</div>
      <Link to="/neighborhood">Back to the hood</Link>
    </>
  );
}
