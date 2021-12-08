import * as React from "react";
import {
  Form,
  useTransition,
  useActionData,
  useLoaderData,
  redirect,
  json,
} from "remix";
import type { MetaFunction, ActionFunction, LoaderFunction } from "remix";
import { differenceInDays, nextMonday } from "date-fns";
import { setFlash, getFlash } from "~/flash";

export const meta: MetaFunction = () => {
  return {
    title: "Moulton",
    description: "A Remix Newsletter",
    "og:title": "Moulton",
    "og:description": "A Remix Newsletter",
    "og:image": "https://readmoulton.com/og.png",
    "og:url": "https://readmoulton.com",
    "twitter:card": "summary_large_image",
  };
};

export let loader: LoaderFunction = async ({ request }) => {
  const [success, headers] = await getFlash(request, "success");
  const query = new URLSearchParams(request.url.split("?")[1]);
  const daysUntilNextIssue =
    differenceInDays(nextMonday(new Date()), new Date()) % 7;

  return json(
    {
      isSuccess: success,
      isConfirmed: query.has("confirmed"),
      daysUntilNextIssue,
    },
    { headers }
  );
};

export let action: ActionFunction = async ({ request }) => {
  const response = await fetch(
    "https://buttondown.email/api/emails/embed-subscribe/moulton",
    {
      body: await formDataAsQueryString(request),
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (response.status >= 400) {
    return { error: true };
  }

  const headers = await setFlash(request, "success");
  return redirect("/", { headers });
};

export default function Index() {
  const { formState, formRef } = useInteractiveForm();
  const inputRef = useFocusedInput();
  const { isConfirmed, isSuccess, daysUntilNextIssue } = useLoaderData();
  const { isSubmitting, isError } = formState;

  return (
    <section className="container">
      <main>
        <h1>Moulton</h1>
        <h2>
          A{" "}
          <a href="https://remix.run" className="remix-link">
            <RemixLogo />
            Remix
          </a>
          Newsletter
        </h2>
        {isConfirmed ? (
          <div className="success">
            🎉 You’ve successfully subscribed. Upcoming issue coming up{" "}
            {daysUntilNextIssue > 0
              ? `in ${daysUntilNextIssue} day${
                  daysUntilNextIssue > 1 ? "s" : ""
                }!`
              : "today!"}
          </div>
        ) : (
          <>
            {isSuccess ? (
              <div className="success">
                Thanks for subscribing, check your inbox to confirm!
              </div>
            ) : (
              <Form method="post" className="subscribe-form" ref={formRef}>
                <input
                  name="email"
                  type="email"
                  placeholder="Your email to receive Remix news every Monday"
                  required
                  ref={inputRef}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={isSubmitting ? "is-submitting" : ""}
                >
                  <span>{isSubmitting ? "Subscribing" : "Subscribe"}</span>
                </button>
                {isError && (
                  <div className="error">Something wrong happened.</div>
                )}
              </Form>
            )}
          </>
        )}
      </main>
      <aside className="disco">
        <span className="dot"></span>
      </aside>
    </section>
  );
}

function RemixLogo() {
  return (
    <svg viewBox="0 0 24 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21.5793 20.007L21.5793 20.0061L21.5792 20.0051C21.4411 18.5657 20.9961 17.4699 20.2553 16.6693C19.6152 15.9774 18.7613 15.5135 17.7133 15.2348C20.5058 14.6493 22.5156 12.3326 22.5156 8.90219C22.5156 6.48016 21.7171 4.49911 20.1051 3.12548C18.4956 1.75398 16.0893 1 12.8961 1H1.10369H1V1.10369V6.10205V6.20574H1.10369H11.7261C13.1173 6.20574 14.1442 6.50458 14.8211 7.03479C15.4942 7.562 15.8344 8.32811 15.8344 9.29575C15.8344 10.4032 15.4923 11.1455 14.8252 11.6171C14.15 12.0943 13.1239 12.3078 11.7261 12.3078H1.10369H1V12.4115V17.5195V17.6232H1.10369H9.44465H11.4141C12.5208 17.6232 13.3465 17.7797 13.9215 18.2619C14.4941 18.742 14.8409 19.5654 14.9376 20.958L14.9377 20.9585V20.9588C15.0849 22.8715 15.0664 23.8175 15.0487 24.7259V24.7267V24.7272C15.043 25.0199 15.0373 25.3095 15.0373 25.6263V25.73H15.141H21.6965H21.8002V25.6263C21.8002 24.1749 21.8002 22.8438 21.5793 20.007Z"
        stroke="currentColor"
      />
      <path
        d="M1 25.6263V25.73H1.10369H9.44439H9.54808V25.6263V23.1893C9.54808 22.9193 9.48229 22.5522 9.25712 22.2498C9.02802 21.9422 8.64338 21.7148 8.03519 21.7148H1.10369H1V21.8184V25.6263Z"
        stroke="currentColor"
      />
    </svg>
  );
}

function useFocusedInput() {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return inputRef;
}

function useInteractiveForm() {
  const formRef = React.useRef<HTMLFormElement>(null);
  const actionData = useActionData();
  const transition = useTransition();

  const isSubmitting = transition.state === "submitting";
  const isSubmitted = ["loading", "idle"].includes(transition.state);
  const isError = isSubmitted && actionData?.error;

  return { formState: { isSubmitting, isError }, formRef };
}

async function formDataAsQueryString(request: Request) {
  const formData = await request.formData();
  const convertedFormData = Array.from(formData, ([key, value]) => [
    key,
    typeof value === "string" ? value : value.name,
  ]);

  return new URLSearchParams(convertedFormData).toString();
}
