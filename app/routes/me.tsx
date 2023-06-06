import { Button, Flex, Text } from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";

function Header() {
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
      <form action="/logout" method="post">
        <Button
          type="submit"
          rightIcon={<ArrowForwardIcon />}
          colorScheme="red"
          variant="outline"
        >
          Log out
        </Button>
      </form>
    </Flex>
  );
}

export default function Me() {
  return (
    <div>
      <Header />
    </div>
  );
}
