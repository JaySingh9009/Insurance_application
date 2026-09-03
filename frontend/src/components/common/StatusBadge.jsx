import React from "react";

export const STATUS_META = {
  ACTIVE: { label: "Active", cls: "badge-active" },
  PENDING: { label: "Pending", cls: "badge-pending" },
  PENDING_PAYMENT: { label: "Pending Payment", cls: "badge-pending" },
  CANCELLED: { label: "Cancelled", cls: "badge-cancelled" },
  EXPIRED: { label: "Expired", cls: "badge-inactive" },
  LAPSED: { label: "Lapsed (Deactivated)", cls: "badge-inactive" },
  INACTIVE: { label: "Lapsed (Deactivated)", cls: "badge-inactive" },
  GRACE_PERIOD: { label: "Grace Period", cls: "badge-pending" },
  SUBMITTED: { label: "Submitted", cls: "badge-submitted" },
  UNDER_REVIEW: { label: "Under Review", cls: "badge-review" },
  RECOMMENDED_APPROVAL: { label: "Recommended ✓", cls: "badge-recommended" },
  RECOMMENDED_REJECTION: { label: "Recommended ✗", cls: "badge-pending" },
  APPROVED: { label: "Approved", cls: "badge-approved" },
  REJECTED: { label: "Rejected", cls: "badge-rejected" },
  SUCCESS: { label: "Success", cls: "badge-success" },
  FAILED: { label: "Failed", cls: "badge-failed" },
  OFFICER: { label: "Insurance Officer", cls: "badge-recommended" },
  AGENT: { label: "Insurance Officer", cls: "badge-recommended" },
  ADMIN: { label: "Admin", cls: "badge-review" },
  CUSTOMER: { label: "Customer", cls: "badge-submitted" },
  true: { label: "Active", cls: "badge-active" },
  false: { label: "Inactive", cls: "badge-inactive" },
};

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, cls: "badge-inactive" };
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

export function ActiveBadge({ active }) {
  return active
    ? <span className="badge badge-active">Active</span>
    : <span className="badge badge-inactive">Inactive</span>;
}

export default StatusBadge;
