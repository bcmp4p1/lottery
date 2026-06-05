"use client";

import { api } from "@/lib/api";
import { useAsync } from "@/hooks/useAsync";
import { DrawCard } from "@/components/draws/DrawCard";
import { Loading } from "@/components/ui/Loading";
import { ErrorText } from "@/components/ui/ErrorText";

const DrawsPage = () => {
  const { data: draws, error, loading } = useAsync(() => api.listDraws(), []);

  if (loading) return <Loading label="Loading draws…" />;
  if (error) return <ErrorText>Failed to load draws: {error}</ErrorText>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Lottery Draws</h1>
      {draws && draws.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {draws.map((draw) => (
            <li key={draw.id}>
              <DrawCard draw={draw} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          No draws available yet. Check back soon!
        </p>
      )}
    </div>
  );
};

export default DrawsPage;
