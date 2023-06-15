import { useEffect, useCallback } from "react";
import type { ActionArgs, LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Flex, Text, useToast } from "@chakra-ui/react";
import type { CredentialResponse } from "@react-oauth/google";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import invariant from "tiny-invariant";
import { useActionData, useLoaderData, useFetcher } from "@remix-run/react";
import jwt_decode from "jwt-decode";

import { badRequest } from "~/utils/request.server";
import { createUserSession, getUserId } from "~/session.server";
import { createUser, getUserByGoogleId } from "~/models/user.server";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Hangar" },
    { name: "description", content: "Bookmark social!" },
  ];
};

export async function action({ request }: ActionArgs) {
  const body = await request.formData();
  const credential = body.get("credential");

  if (typeof credential !== "string") {
    return badRequest({
      loginError: "Invalid credential",
    });
  }

  const { name, email, sub, picture } = jwt_decode(credential) as {
    name: string;
    email: string;
    sub: string;
    picture: string;
  };

  let user = await getUserByGoogleId(sub);
  if (!user) {
    user = await createUser(name, email, sub, picture);
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo: "/me",
  });
}

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect("/me");
  }

  return json({
    ENV: {
      REACT_APP_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    },
  });
}

function Header({
  onLoginSuccess,
  onLoginError,
}: {
  onLoginSuccess: (credentialResponse: CredentialResponse) => void;
  onLoginError: () => void;
}) {
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
      <GoogleLogin onSuccess={onLoginSuccess} onError={onLoginError} />
    </Flex>
  );
}

export default function Index() {
  const toast = useToast();
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();
  const data = useLoaderData<typeof loader>();
  invariant(data.ENV.REACT_APP_GOOGLE_CLIENT_ID, "Google Client ID not set");

  const handleLoginError = useCallback(() => {
    toast({
      title: "Something went wrong.",
      description: "We're not able the go through Google Login.",
      status: "error",
      duration: 9000,
      isClosable: true,
    });
  }, [toast]);

  useEffect(() => {
    if (actionData?.loginError) {
      handleLoginError();
    }
  }, [actionData, handleLoginError]);

  const handleLoginSuccess = (response: CredentialResponse) => {
    if (!response.credential) {
      handleLoginError();
      return;
    }

    fetcher.submit(
      {
        credential: response.credential,
      },
      { method: "POST" }
    );
  };

  return (
    <GoogleOAuthProvider clientId={data.ENV.REACT_APP_GOOGLE_CLIENT_ID}>
      <Header
        onLoginSuccess={handleLoginSuccess}
        onLoginError={handleLoginError}
      />
    </GoogleOAuthProvider>
  );
}
