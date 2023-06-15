import { useEffect } from "react";
import {
  useActionData,
  useLoaderData,
  useParams,
  useRouteError,
  useNavigation,
  isRouteErrorResponse,
  Link,
  Form,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useToast, Box, IconButton, Flex, Text } from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";
import invariant from "tiny-invariant";

import {
  followUser,
  getUserById,
  isFollowing,
  unfollowUser,
} from "~/models/user.server";
import { getUserId } from "~/session.server";

// control errors

export async function loader({ params, request }: LoaderArgs) {
  console.log("loader");
  const { id } = params;
  invariant(id, "User must be provided");

  const neighbor = await getUserById(id);
  if (!neighbor) {
    throw new Response("User not found.", {
      status: 404,
    });
  }

  const userId = await getUserId(request);

  const following = userId ? await isFollowing(userId, id) : false;

  return json({ neighbor, userId, following });
}

export async function action({ params, request }: ActionArgs) {
  const { id } = params;
  invariant(id, "User must be provided");

  const body = await request.formData();
  const action = body.get("action");

  const userId = await getUserId(request);
  if (!userId) {
    throw new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    action === "follow"
      ? await followUser(userId, id)
      : await unfollowUser(userId, id);
  } catch (error) {
    return json({ status: 500 });
  }

  return json({ status: 200 });
}

function Header({
  neighborName,
  userId,
  itsMe,
  following,
}: {
  neighborName: string;
  userId?: string;
  itsMe: boolean;
  following: boolean;
}) {
  const { state } = useNavigation();
  const isLoading = state !== "idle";

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding="1rem"
    >
      <Text fontSize="3xl" fontWeight="bold">
        Hangar
      </Text>
      <Flex alignItems="center" columnGap={2}>
        <Text fontSize="xl">{neighborName}</Text>
        {userId && !itsMe && (
          <Form method="post">
            <input
              type="hidden"
              name="action"
              value={following ? "unfollow" : "follow"}
            />
            <IconButton
              type="submit"
              variant={following ? "solid" : "outline"}
              colorScheme="yellow"
              aria-label="Follow"
              icon={<StarIcon />}
              isLoading={isLoading}
            />
          </Form>
        )}
      </Flex>
    </Flex>
  );
}

export default function Neighbor() {
  const toast = useToast();
  const actionData = useActionData<typeof action>();
  const { neighbor, userId, following } = useLoaderData<typeof loader>();
  const itsMe = neighbor.id === userId;

  useEffect(() => {
    if (actionData?.status && actionData?.status !== 200) {
      toast({
        position: "bottom-left",
        render: () => (
          <Box color="white" p={3} bg="red.500">
            Something went wrong!
          </Box>
        ),
      });
    }
  }, [actionData, toast]);

  return (
    <>
      <Header
        userId={userId}
        neighborName={neighbor.username}
        itsMe={itsMe}
        following={following}
      />
    </>
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
