interface Props {
  message?: string;
}

export default function EmptyState({ message = 'No data found' }: Props) {
  return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-lg">{message}</p>
    </div>
  );
}
