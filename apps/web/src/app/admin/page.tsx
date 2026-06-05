"use client";

import Link from "next/link";
import type { Draw } from "@lottery/shared";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/components/AuthProvider";
import { CreateDrawForm } from "@/components/draws/CreateDrawForm";
import { AdminDrawRow } from "@/components/admin/AdminDrawRow";
import { Loading } from "@/components/ui/Loading";
import { ErrorText } from "@/components/ui/ErrorText";

const AdminPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { data: draws, error, loading, reload } = useAsync(
    () => (isAdmin ? api.listAllDraws() : Promise.resolve<Draw[]>([])),
    [isAdmin],
  );

  if (authLoading) return <Loading />;
  if (!isAdmin)
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Admins only.{" "}
        <Link href="/" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Go home
        </Link>
        .
      </p>
    );

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-4 text-2xl font-bold">Create a draw</h1>
        <CreateDrawForm onCreated={reload} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">All draws</h2>
        {error && <ErrorText>{error}</ErrorText>}
        {loading ? (
          <Loading />
        ) : (
          <ul className="space-y-3">
            {draws?.map((draw) => (
              <AdminDrawRow key={draw.id} draw={draw} onChange={reload} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
