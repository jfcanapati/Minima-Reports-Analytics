import { Skeleton } from "@/components/ui/Skeleton";

export default function RevenueLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
