import { Form, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Button, Flex, Text } from "@chakra-ui/react";

import metascraper from "metascraper";
import metascraperTitle from "metascraper-title";
import metascraperImage from "metascraper-image";
import metascraperDescription from "metascraper-description";

import { requireUser } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);

  const siteUrl = "https://www.youtube.com/watch?v=t-nchkL9yIg";
  const response = await fetch(siteUrl);
  const html = await response.text();
  const url = response.url;
  const metadata = await metascraper([
    metascraperTitle(),
    metascraperImage(),
    metascraperDescription(),
  ])({ html, url });
  console.log(metadata);

  return json({ user });
}

function Header({ username }: { username: string }) {
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
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <Header username={user.username} />
    </>
  );
}
