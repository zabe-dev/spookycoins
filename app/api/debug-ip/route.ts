export async function GET(request: Request) {
  const h = Object.fromEntries(request.headers.entries());
  return Response.json(h);
}
