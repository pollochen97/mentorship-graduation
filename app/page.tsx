import { Suspense } from "react";
import { BookShell } from "@/components/book/BookShell";
import { isProjector } from "@/lib/screen-gate";

// The server checks the httpOnly `screen` cookie (spec 3.5); the browser only learns the answer.
async function Book() {
  return <BookShell isProjector={await isProjector()} />;
}

export default function Home() {
  // Reading cookies makes the book request-time, so it streams in behind this boundary.
  return (
    <Suspense>
      <Book />
    </Suspense>
  );
}
