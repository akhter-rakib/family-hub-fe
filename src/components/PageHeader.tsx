import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function PageHeader({ title, children, action }: Props) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {action}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
