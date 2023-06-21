import { Form, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Button, Flex, Text } from "@chakra-ui/react";

import { requireUser } from "~/session.server";
import playwright from "playwright";

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);

  const browser = await playwright.chromium.launch({
    headless: true, // setting this to true will not run the UI
  });
  const page = await browser.newPage();
  await page.goto("https://finance.yahoo.com/world-indices");
  const dom = await page.content();
  console.log(dom);

  await browser.close();

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
