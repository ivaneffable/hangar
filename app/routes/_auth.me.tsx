import { useEffect, useRef } from "react";
import {
  Form,
  Outlet,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Button, Flex, Input, Spacer, useToast } from "@chakra-ui/react";

import { scrapeMetadata } from "~/utils/metascraper.server";
import {
  addBookmarkTimesOpened,
  createBookmark,
  getUserBookmarks,
} from "~/models/bookmark.server";
import { requireUser } from "~/session.server";
import { Bookmark } from "~/components/Bookmark";

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  const bookmarks = await getUserBookmarks(user.id, 0);

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
    })),
  });
}

export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);

  const formData = await request.formData();
  const { _action } = Object.fromEntries(formData);

  if (_action === "add-bookmark") {
    const link = formData.get("link");

    if (typeof link !== "string" || link.length === 0) {
      return json(
        {
          errors: { title: "A link is required.", description: null },
        },
        { status: 400 }
      );
    }

    const metadata = await scrapeMetadata(link);

    if (!metadata) {
      return json(
        {
          errors: {
            title: "Invalid link provided.",
            description:
              'The link should follow the format "https://example.com"',
          },
        },
        { status: 400 }
      );
    }

    try {
      const response = await createBookmark({
        userId: user.id,
        tags: [] as string[],
        ...metadata,
      });
      return redirect(`/me/${response.id}`);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Bookmark already exists"
      ) {
        return json(
          {
            errors: {
              title: "Link already included in your Hangar",
              description: null,
            },
          },
          { status: 400 }
        );
      }
      return json(
        {
          errors: {
            title: "Something is wrong with the link provided.",
            description: null,
          },
        },
        { status: 400 }
      );
    }
  }

  if (_action === "addTimesOpened") {
    const bookmarkId = formData.get("bookmark");

    if (typeof bookmarkId !== "string" || bookmarkId.length === 0) {
      return json({ status: 500, errors: null });
    }

    await addBookmarkTimesOpened(bookmarkId);
  }

  return redirect("/me");
}

export default function Me() {
  const submit = useSubmit();
  const toast = useToast();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const actionData = useActionData<typeof action>();
  const { bookmarks } = useLoaderData<typeof loader>();

  const addLinkForm = useRef<HTMLFormElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const isAddingLink =
    navigation.state === "submitting" &&
    navigation.formData.get("_action") === "add-bookmark";

  useEffect(() => {
    if (!isAddingLink) {
      addLinkForm.current?.reset();
    }
  }, [isAddingLink]);

  useEffect(() => {
    if (actionData?.errors?.title) {
      toast({
        title: actionData?.errors?.title,
        description: actionData?.errors?.description || "",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }, [actionData, toast]);

  return (
    <>
      <Form method="post" ref={addLinkForm}>
        <Flex columnGap={2} m={4} justifyContent="flex-end">
          <Input
            ref={linkInput}
            w={{ base: "100%", md: "50%", lg: "25%" }}
            placeholder="Add a link to your hangar"
            name="link"
            autoComplete="off"
            errorBorderColor="red.300"
          />
          <Button
            type="submit"
            colorScheme="green"
            variant="solid"
            name="_action"
            value="add-bookmark"
          >
            Add Link
          </Button>
        </Flex>
      </Form>
      <Spacer top={4} />
      <Flex wrap="wrap" gap="2" justifyContent="start">
        {bookmarks.map((bookmark) => (
          <Bookmark
            key={bookmark.id}
            value={bookmark}
            onOpen={() => {
              submit(
                { _action: "addTimesOpened", bookmark: bookmark.id },
                { method: "POST", action: "/me" }
              );
            }}
            onOpenDetail={() => navigate(`/me/${bookmark.id}`)}
          />
        ))}
      </Flex>
      <Outlet context={bookmarks} />
    </>
  );
}
