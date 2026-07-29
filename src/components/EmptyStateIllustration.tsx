import { memo } from "react";

export const EmptyStateIllustration = memo(function EmptyStateIllustration() {
  return (
    <svg className="empty-illustration" width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Empty state illustration">
      <rect x="30" y="16" width="100" height="88" rx="8" stroke="#94a3b8" strokeWidth="2" fill="#f8fafc" />
      <rect x="46" y="8" width="68" height="16" rx="4" fill="#eab308" />
      <rect x="46" y="38" width="16" height="4" rx="2" fill="#cbd5e1" />
      <rect x="46" y="50" width="48" height="4" rx="2" fill="#cbd5e1" />
      <rect x="46" y="62" width="36" height="4" rx="2" fill="#cbd5e1" />
      <rect x="46" y="74" width="56" height="4" rx="2" fill="#cbd5e1" />
      <rect x="98" y="38" width="16" height="4" rx="2" fill="#cbd5e1" />
      <rect x="98" y="50" width="16" height="4" rx="2" fill="#cbd5e1" />
      <rect x="82" y="62" width="16" height="4" rx="2" fill="#cbd5e1" />
      <rect x="74" y="74" width="16" height="4" rx="2" fill="#cbd5e1" />
      <circle cx="80" cy="104" r="16" fill="#eab308" opacity="0.15" />
      <path d="M74 106l4 4 8-8" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});
