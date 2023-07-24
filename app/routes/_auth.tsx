import {
  Link,
  Form,
  Outlet,
  useLoaderData,
  useMatches,
  useNavigation,
} from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useToast,
  Box,
  Button,
  IconButton,
  Flex,
  Text,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";

import { requireUser } from "~/session.server";

export async function loader({ params, request }: LoaderArgs) {
  const user = await requireUser(request);

  return json({
    user: {
      id: user.id,
      username: user.username,
    },
  });
}

function Header({
  user,
  neighbor,
}: {
  user: { id: string; username: string };
  neighbor?: {
    id: string;
    username: string;
    following: boolean;
  };
}) {
  const { state } = useNavigation();
  const isSubmitting = state === "submitting";

  const itsMe = neighbor?.id === user.id;
  return (
    <Flex as="header" align="center" justify="space-between" wrap="wrap">
      <Flex alignItems="end" columnGap={2}>
        <Text fontSize="3xl" fontWeight="bold">
          Hangar
        </Text>
        <Link to="/me">
          <Text fontSize="xl" ml={4}>
            My hangar
          </Text>
        </Link>
        <Link to="/neighborhood">
          <Text fontSize="xl" ml={4}>
            Neighborhood
          </Text>
        </Link>
        {neighbor && !itsMe && (
          <Flex alignItems="end" columnGap={2}>
            <Text fontSize="xl">{neighbor.username}</Text>
            <Form method="post" action={`/neighborhood/${neighbor.id}`}>
              <input
                type="hidden"
                name="_action"
                value={neighbor.following ? "unfollow" : "follow"}
              />
              <IconButton
                type="submit"
                variant={neighbor.following ? "solid" : "outline"}
                colorScheme="yellow"
                aria-label="Follow"
                icon={<StarIcon />}
                isLoading={isSubmitting}
              />
            </Form>
          </Flex>
        )}
      </Flex>

      <Flex alignItems="center" columnGap={2}>
        <Text fontSize="xl">{user.username}</Text>
        <Form action="/logout" method="post">
          <Button type="submit" colorScheme="red" variant="solid">
            Log out
          </Button>
        </Form>
      </Flex>
    </Flex>
  );
}

export default function Auth() {
  const { user } = useLoaderData<typeof loader>();

  const matches = useMatches();
  const neighbor = matches.find(
    (match) => match.id === "routes/_auth.neighborhood.$id"
  )?.data?.neighbor;

  return (
    <Box padding={4}>
      <Header user={user} neighbor={neighbor} />

      <Outlet />
    </Box>
  );
}
