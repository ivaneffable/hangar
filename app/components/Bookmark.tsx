import {
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  Image,
  Stack,
  Link,
  Text,
} from "@chakra-ui/react";
import { Link as RemixLink } from "@remix-run/react";
import { ChevronRightIcon, TriangleUpIcon, ViewIcon } from "@chakra-ui/icons";

import type { Bookmark as TypeBookmark, User } from "@prisma/client";

type Props = {
  value: Pick<
    TypeBookmark,
    "url" | "image" | "title" | "description" | "timesLiked" | "timesOpened"
  >;
  onOpen: () => void;
  onLike?: () => void;
  onOpenDetail: () => void;
  user?: Pick<User, "id" | "username">;
};
export function Bookmark(props: Props) {
  return (
    <Card maxW={250} minWidth={250}>
      <Flex flexDirection="column" justifyContent="space-between" h="100%">
        <Link
          href={props.value.url}
          isExternal
          onClick={props.onOpen}
          _hover={{ textDecoration: "none" }}
        >
          <Image
            src={props.value.image}
            alt="Website image"
            borderTopRadius="md"
          />
          <Stack mt="2" mr="2" ml="2" spacing="3">
            <Heading size="xs">{props.value.title}</Heading>
          </Stack>
        </Link>

        <Flex justifyContent="space-between" m={2}>
          {props.onLike && (
            <Box as="button" onClick={props.onLike}>
              <TriangleUpIcon />
              {props.value.timesLiked}
            </Box>
          )}
          <Box>
            <ViewIcon />
            {props.value.timesOpened}
          </Box>
          <Box as="button" onClick={props.onOpenDetail}>
            <ChevronRightIcon />
          </Box>
        </Flex>
        {props.user && (
          <Flex justifyContent="start" mt={4}>
            <RemixLink to={`/neighborhood/${props.user.id}`}>
              <Text fontSize="lg">{props.user.username}</Text>
            </RemixLink>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
