import { useEffect, useRef } from "react";
import {
  Form,
  useNavigate,
  useNavigation,
  useOutletContext,
  useParams,
} from "@remix-run/react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Image,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  Tag,
  TagLabel,
  Text,
} from "@chakra-ui/react";
import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { SmallCloseIcon } from "@chakra-ui/icons";
import type { Bookmark } from "@prisma/client";

import {
  addTagToBookmark,
  deleteBookmark,
  deleteTagToBookmark,
} from "~/models/bookmark.server";
import { requireUser } from "~/session.server";

export async function action({ request }: ActionArgs) {
  await requireUser(request);

  const formData = await request.formData();
  const bookmarkId = formData.get("bookmarkId");
  const tag = formData.get("tag");
  const { _action } = Object.fromEntries(formData);

  if (_action === "add-tag") {
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

    return redirect("/me");
  }

  return redirect(`/me/${bookmarkId}`);
}

export default function MyBookmark() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  let { bookmarkId } = useParams();
  const bookmarks = useOutletContext<Bookmark[]>();

  const addTabForm = useRef<HTMLFormElement>(null);
  const tabInput = useRef<HTMLInputElement>(null);
  const isAddingTab =
    navigation.state === "submitting" &&
    navigation.formData.get("_action") === "add-tag";

  const bookmarkInEdition = bookmarks.find(
    (bookmark) => bookmark.id === bookmarkId
  );

  useEffect(() => {
    if (!isAddingTab) {
      addTabForm.current?.reset();
      tabInput.current?.focus();
    }
  }, [isAddingTab]);

  const closeMyBookark = () => {
    navigate("/me");
  };

  return (
    <Modal size="xs" isOpen={true} onClose={closeMyBookark} closeOnEsc={false}>
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
                    onClick={closeMyBookark}
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
  );
}
