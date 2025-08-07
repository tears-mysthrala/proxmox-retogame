export function Button({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:bg-gray-700 disabled:text-gray-400 transition-colors"
    >
      {children}
    </button>
  );
}