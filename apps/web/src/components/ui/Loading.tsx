export const Loading = ({ label = "Loading…" }: { label?: string }) => {
  return <p className="text-gray-500 dark:text-gray-400">{label}</p>;
}
