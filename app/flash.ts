import { createCookieSessionStorage } from "remix";
import type { Session } from "@remix-run/server-runtime";

const { getSession, commitSession } = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    secure: true,
  },
});

export async function setFlash(request: Request, key: string, value?: any) {
  const session = await getSession(request.headers.get("cookie"));
  session.flash(key, value || true);
  return {
    "Set-Cookie": await commitSession(session),
  };
}

export async function getFlash(request: Request, key: string) {
  const session = await getSession(request.headers.get("Cookie"));
  const value = session.get(key) || null;
  return [
    value,
    {
      "Set-Cookie": await commitSession(session),
    },
  ];
}
