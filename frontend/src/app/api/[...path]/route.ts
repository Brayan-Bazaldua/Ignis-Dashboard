import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const apiUrl = (process.env.API_URL ?? "http://127.0.0.1:8000").replace(
  /\/+$/,
  "",
);

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function forward(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const { path } = await context.params;

  if (path.some((segment) => segment === "." || segment === "..")) {
    return Response.json({ error: "Invalid API path" }, { status: 400 });
  }

  const target = new URL(
    `/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
    apiUrl,
  );

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", request.headers.get("accept") ?? "application/json");

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("content-type", upstreamContentType);
    }
    const upstreamCacheControl = upstream.headers.get("cache-control");
    if (upstreamCacheControl) {
      responseHeaders.set("cache-control", upstreamCacheControl);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ error: "API upstream unavailable" }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const HEAD = forward;
export const OPTIONS = forward;
