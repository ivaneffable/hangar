import { useEffect, useRef, useState } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  Input,
  Image,
  Stack,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  Spacer,
  Tag,
  TagLabel,
  Text,
  useToast,
} from "@chakra-ui/react";
import { SmallCloseIcon, EditIcon } from "@chakra-ui/icons";
import type { Bookmark } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { scrapeMetadata } from "~/utils/metascraper.server";
import {
  addTagToBookmark,
  deleteTagToBookmark,
  createBookmark,
  deleteBookmark,
  getUserBookmarks,
} from "~/models/bookmark.server";
import { requireUser } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  const bookmarks = await getUserBookmarks(user.id);

  return json({
    user: {
      id: user.id,
      username: user.username,
    },
    bookmarks: bookmarks.map((bookmark) => ({
      id: bookmark.id,
      title: bookmark.title,
      description: bookmark.description,
      image: bookmark.image,
      url: bookmark.url,
      tags: bookmark.tags,
    })),
  });
}

export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);

  const formData = await request.formData();
  const { _action } = Object.fromEntries(formData);

  if (_action === "add-link") {
    const link = formData.get("link");

    if (typeof link !== "string" || link.length === 0) {
      return json(
        {
          errors: { title: "A link is required.", description: null },
          bookmark: null,
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
          bookmark: null,
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
      console.log(response);
      return json(
        {
          bookmark: {
            id: response.id,
          },
          errors: null,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return json(
            {
              errors: {
                title: "Link already included in your Hangar",
                description: null,
              },
              bookmark: null,
            },
            { status: 400 }
          );
        }
      }
      return json(
        {
          errors: {
            title: "Something is wrong with the link provided.",
            description: null,
          },
          bookmark: null,
        },
        { status: 400 }
      );
    }
  }

  if (_action === "add-tag") {
    const bookmarkId = formData.get("bookmarkId");
    const tag = formData.get("tag");

    if (
      typeof bookmarkId !== "string" ||
      bookmarkId.length === 0 ||
      typeof tag !== "string" ||
      tag.length === 0
    ) {
      return json(
        {
          errors: { title: "Bookmark id is required.", description: null },
          bookmark: null,
        },
        { status: 400 }
      );
    }

    if (tag) {
      await addTagToBookmark(bookmarkId, tag);
    }
  }

  if (_action === "delete-tag") {
    const bookmarkId = formData.get("bookmarkId");
    const tag = formData.get("tag");

    if (
      typeof bookmarkId !== "string" ||
      bookmarkId.length === 0 ||
      typeof tag !== "string" ||
      tag.length === 0
    ) {
      return json(
        {
          errors: { title: "Bookmark id is required.", description: null },
          bookmark: null,
        },
        { status: 400 }
      );
    }

    if (tag) {
      await deleteTagToBookmark(bookmarkId, tag);
    }
  }

  if (_action === "delete-bookmark") {
    const bookmarkId = formData.get("bookmarkId");

    if (typeof bookmarkId !== "string" || bookmarkId.length === 0) {
      return json(
        {
          errors: { title: "Bookmark id is required.", description: null },
          bookmark: null,
        },
        { status: 400 }
      );
    }

    await deleteBookmark(bookmarkId);
  }

  return redirect("/me");
}

function Header({ username }: { username: string }) {
  return (
    <Flex as="header" align="center" justify="space-between" wrap="wrap">
      <Text fontSize="3xl" fontWeight="bold">
        Hangar
      </Text>
      <Flex alignItems="center" columnGap={2}>
        <Text fontSize="xl">{username}</Text>
        <Form action="/logout" method="post">
          <Button type="submit" colorScheme="red" variant="solid">
            Log out
          </Button>
        </Form>
      </Flex>
    </Flex>
  );
}

export default function Me() {
  const toast = useToast();
  const navigation = useNavigation();
  const [openedBookmark, setOpenedBookmark] = useState<Bookmark["id"] | null>(
    null
  );
  const actionData = useActionData<typeof action>();
  const { user, bookmarks } = useLoaderData<typeof loader>();

  const addLinkForm = useRef<HTMLFormElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const isAddingLink =
    navigation.state === "submitting" &&
    navigation.formData.get("_action") === "add-link";

  const addTabForm = useRef<HTMLFormElement>(null);
  const tabInput = useRef<HTMLInputElement>(null);
  const isAddingTab =
    navigation.state === "submitting" &&
    navigation.formData.get("_action") === "add-tag";

  useEffect(() => {
    if (!isAddingLink) {
      addLinkForm.current?.reset();
      if (actionData?.bookmark?.id) {
        setOpenedBookmark(actionData?.bookmark?.id);
      }
    }
  }, [isAddingLink, actionData?.bookmark?.id]);

  useEffect(() => {
    if (!isAddingTab) {
      addTabForm.current?.reset();
      tabInput.current?.focus();
    }
  }, [isAddingTab]);

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
  }, [actionData]);

  const bookmarkInEdition = bookmarks.find(
    (bookmark) => bookmark.id === openedBookmark
  );

  return (
    <Box padding={4}>
      <Header username={user.username} />
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
            value="add-link"
          >
            Add Link
          </Button>
        </Flex>
      </Form>
      <Spacer top={4} />
      <Flex wrap="wrap" gap="5" justifyContent="space-between">
        {bookmarks.map((bookmark) => (
          <Card key={bookmark.id} maxW="sm" minWidth="sm">
            <CardBody>
              <Flex
                flexDirection="column"
                justifyContent="space-between"
                h="100%"
              >
                <Link
                  href={bookmark.url}
                  isExternal
                  _hover={{ textDecoration: "none" }}
                >
                  <Image
                    src={bookmark.image}
                    alt="Website image"
                    borderRadius="lg"
                  />
                  <Stack mt="6" spacing="3">
                    <Heading size="md">{bookmark.title}</Heading>
                    <Text>{bookmark.description}</Text>
                  </Stack>
                </Link>

                <Flex justifyContent="flex-end">
                  <Box
                    as="button"
                    onClick={() => setOpenedBookmark(bookmark.id)}
                  >
                    <EditIcon />
                  </Box>
                </Flex>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </Flex>

      <Modal
        size="xs"
        isOpen={Boolean(openedBookmark)}
        onClose={() => setOpenedBookmark(null)}
        closeOnEsc={false}
      >
        <ModalOverlay />
        <ModalContent>
          {bookmarkInEdition && (
            <Box p={4}>
              <Image
                src={bookmarkInEdition.image}
                alt="Website image"
                borderRadius="lg"
              />
              <Stack mt="6" spacing="3">
                <Heading size="md">{bookmarkInEdition.title}</Heading>
                <Text>{bookmarkInEdition.description}</Text>
              </Stack>

              <Flex flexDirection="column" mt={4}>
                <Flex columnGap={2}>
                  {bookmarkInEdition.tags.map((tag) => (
                    <Form method="post" key={tag}>
                      <Input
                        type="hidden"
                        name="bookmarkId"
                        value={bookmarkInEdition.id}
                      />
                      <Input type="hidden" name="tag" value={tag} />
                      <Tag
                        size="md"
                        borderRadius="full"
                        variant="solid"
                        colorScheme="blue"
                      >
                        <TagLabel>{tag}</TagLabel>
                        <button type="submit" name="_action" value="delete-tag">
                          <SmallCloseIcon />
                        </button>
                      </Tag>
                    </Form>
                  ))}
                </Flex>

                <Form ref={addTabForm} method="post">
                  <Flex mt={4} columnGap={2}>
                    <Input
                      type="hidden"
                      name="bookmarkId"
                      value={bookmarkInEdition.id}
                    />
                    <Input
                      ref={tabInput}
                      placeholder="Add a tag"
                      name="tag"
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      colorScheme="green"
                      variant="solid"
                      name="_action"
                      value="add-tag"
                    >
                      Add Tag
                    </Button>
                  </Flex>
                </Form>

                <Form method="post">
                  <Flex mt={12} columnGap={2} justifyContent="center">
                    <Input
                      type="hidden"
                      name="bookmarkId"
                      value={bookmarkInEdition.id}
                    />
                    <Button
                      type="submit"
                      colorScheme="red"
                      variant="solid"
                      name="_action"
                      value="delete-bookmark"
                      onClick={() => setOpenedBookmark(null)}
                    >
                      Delete Bookmark
                    </Button>
                  </Flex>
                </Form>
              </Flex>
            </Box>
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
}
