import type { PropsWithChildren } from 'react';

type WorkingFileHeaderProps = PropsWithChildren<{
  title: string;
  titleAttribute?: string;
}>;

export function WorkingFileHeader({ title, titleAttribute, children }: WorkingFileHeaderProps) {
  return (
    <div className="uploaded-files-header">
      <p className="uploaded-file-name" title={titleAttribute ?? title}>
        {title}
      </p>
      <div className="stack-row">{children}</div>
    </div>
  );
}
