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
    <Card maxW="sm" minWidth="sm">
      <CardBody>
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
              borderRadius="lg"
            />
            <Stack mt="6" spacing="3">
              <Heading size="md">{props.value.title}</Heading>
              <Text>{props.value.description}</Text>
            </Stack>
          </Link>

          <Flex justifyContent="space-between" mt={4}>
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
      </CardBody>
    </Card>
  );
}
