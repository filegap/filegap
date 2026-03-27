type WorkspaceEmptyStateProps = {
  title: string;
  hint: string;
};

export function WorkspaceEmptyState({ title, hint }: WorkspaceEmptyStateProps) {
  return (
    <div className="file-table-empty">
      <p>{title}</p>
      <p>{hint}</p>
    </div>
  );
}
