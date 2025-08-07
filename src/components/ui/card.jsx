export function Card({ children, className }) {
  return <div className={`rounded-2xl shadow bg-gray-800 border border-gray-700 ${className}`}>{children}</div>;
}

export function CardContent({ children, className }) {
  return <div className={className}>{children}</div>;
}