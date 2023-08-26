import { useEffect } from "react";
import { json } from "@remix-run/node";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useToast, Flex } from "@chakra-ui/react";

import { getNeighborhoodBookmarks } from "~/models/bookmark.server";
import { requireUserId, requireUser } from "~/session.server";
import { addTimesOpened, addToHangar } from "~/utils/bookmarkActions.server";
import { Bookmark } from "~/components/Bookmark";

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  const bookmarks = await getNeighborhoodBookmarks(user.id, 0);

  return json({
    bookmarks: bookmarks.map((bookmark) => ({
      id: bookmark.id,
      title: bookmark.title,
      description: bookmark.description,
      image: bookmark.image,
      url: bookmark.url,
      tags: bookmark.tags,
      timesOpened: bookmark.timesOpened,
      timesLiked: bookmark.timesLiked,
      userId: bookmark.userId,
      username: bookmark.user.username,
    })),
  });
}

export async function action({ params, request }: ActionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  const { _action, bookmark } = Object.fromEntries(formData);

  if (typeof bookmark !== "string" || bookmark.length === 0) {
    return json({ status: 500 });
  }

  if (_action === "addTimesOpened") {
    return await addTimesOpened(bookmark);
  }

  if (_action === "addBookmarkToHangar") {
    return await addToHangar(bookmark, userId);
  }

  return json({ status: 200 });
}

export default function Neighborhood() {
  const toast = useToast();
  const submit = useSubmit();
  const { bookmarks } = useLoaderData<typeof loader>();
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
              { method: "POST", action: "/neighborhood" }
            );
          }}
          onLike={() => {
            submit(
              { _action: "addBookmarkToHangar", bookmark: bookmark.id },
              { method: "POST", action: "/neighborhood" }
            );
          }}
          user={{ id: bookmark.userId, username: bookmark.username }}
        />
      ))}
    </Flex>
  );
}
