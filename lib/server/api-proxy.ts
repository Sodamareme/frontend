import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function proxyApiRequest(
  request: Request,
  path: string,
  init?: { method?: string },
) {
  const method = init?.method || request.method;
  const incomingHeaders = new Headers(request.headers);
  const headers = new Headers();

  const authorization = incomingHeaders.get("authorization");
  const accept = incomingHeaders.get("accept");
  const contentType = incomingHeaders.get("content-type");

  if (authorization) {
    headers.set("authorization", authorization);
  }

  if (accept) {
    headers.set("accept", accept);
  }

  if (contentType) {
    headers.set("content-type", contentType);
  }

  const hasBody = !["GET", "HEAD"].includes(method.toUpperCase());
  const body = hasBody ? await request.text() : undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const responseBody = await response.text();
  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");

  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType);
  }

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}
