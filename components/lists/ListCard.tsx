import type { UserListExpenseSummary } from "@/types/list";

interface Props {
  list: UserListExpenseSummary;
  onClick?: () => void;
}

export function ListCard({ list, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-150 hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {list.name}
        </h3>
        {/* arrow icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-indigo-400 transition-colors mt-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Description */}
      {list.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{list.description}</p>
      )}

      {/* Expense badge */}
      <div className="mt-auto flex items-center gap-1.5">
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          ₹{list.total_expense.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-xs text-gray-400">total expenses</span>
      </div>
    </button>
  );
}
