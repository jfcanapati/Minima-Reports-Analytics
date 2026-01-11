"use client";

import { Button } from "@/components/ui/Button";

export default function OccupancyError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <h2 className="text-xl font-semibold mb-2">Something went wrong!</h2>
      <p className="text-gray-500 mb-4">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
