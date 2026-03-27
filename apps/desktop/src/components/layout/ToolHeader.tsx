type ToolHeaderProps = {
  title: string;
  subtitle: string;
};

export function ToolHeader({ title, subtitle }: ToolHeaderProps) {
  return (
    <header className="tool-page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}
