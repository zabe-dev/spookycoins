'use client';

import {
  addPromotedCoin,
  deleteAdminCoin,
  deleteAdminUser,
  grantCoinBoost,
  removeCoinBoost,
  removePromotedCoin,
  updateAdminCoin,
  updateAdminSubmission,
  updateAdminUser,
} from '@/app/admin/dashboard/actions';
import {
  Check,
  Eye,
  ExternalLink,
  Megaphone,
  Pause,
  Pencil,
  Play,
  Search,
  Square,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';

export type AdminSummary = {
  users: number;
  coins: number;
  activeBoosts: number;
  promotedCoins: number;
  pendingSubmissions: number;
};

export type AdminSubmissionRow = {
  id: string;
  logoUrl: string | null;
  name: string;
  symbol: string;
  chain: string;
  submittedBy: string;
  contactEmail: string;
  contactTelegram: string;
  submittedAt: string;
  status: string;
  flag: string;
  details: AdminSubmissionDetailSection[];
  rawData: string;
};

export type AdminSubmissionDetailSection = {
  title: string;
  rows: Array<{ label: string; value: string }>;
};

export type AdminCoinRow = {
  id: number;
  logoUrl: string | null;
  name: string;
  symbol: string;
  chain: string;
  submittedBy: string;
  contactEmail: string;
  contactTelegram: string;
  submittedAt: string;
  status: string;
  category: string;
  boost: {
    tier: number;
    status: string;
    expiresAt: string;
    remaining: string;
  } | null;
  promotion: {
    status: string;
    priority: number;
    expiresAt: string;
    remaining: string;
  } | null;
};

export type AdminUserRow = {
  id: string;
  avatar: string;
  avatarTone: number;
  name: string;
  email: string;
  role: string;
  status: string;
  projectsSubmitted: number;
  joinedAt: string;
  lastActive: string;
  lastIp: string;
};

type AdminDashboardClientProps = {
  summary: AdminSummary;
  pendingSubmissions: AdminSubmissionRow[];
  listedCoins: AdminCoinRow[];
  users: AdminUserRow[];
};

type PopoverController = {
  activePopoverId: string | null;
  setActivePopoverId: (id: string | null) => void;
};

const pageSize = 10;
const boostPackages = [
  { value: 10, label: '10x', detail: 'votes ×2 · 24h' },
  { value: 30, label: '30x', detail: 'votes ×2 · 72h' },
  { value: 50, label: '50x', detail: 'votes ×3 · 24h' },
  { value: 100, label: '100x', detail: 'votes ×3 · 72h' },
  { value: 500, label: '500x', detail: 'votes ×5 · 168h' },
];

export function AdminDashboardClient({
  summary,
  pendingSubmissions,
  listedCoins,
  users,
}: AdminDashboardClientProps) {
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const popover = { activePopoverId, setActivePopoverId };

  return (
    <>
      <div className="admin-dashboard-grid" aria-label="Admin summary">
        <SummaryCard label="Users" value={summary.users} />
        <SummaryCard label="Listed coins" value={summary.coins} />
        <SummaryCard label="Active boosts" value={summary.activeBoosts} />
        <SummaryCard label="Promoted coins" value={summary.promotedCoins} />
        <SummaryCard label="Pending submissions" value={summary.pendingSubmissions} />
      </div>

      <PendingSubmissionsTable rows={pendingSubmissions} popover={popover} />
      <ListedCoinsTable rows={listedCoins} popover={popover} />
      <UsersTable rows={users} popover={popover} />
    </>
  );
}

function PendingSubmissionsTable({
  rows,
  popover,
}: {
  rows: AdminSubmissionRow[];
  popover: PopoverController;
}) {
  const [detailRow, setDetailRow] = useState<AdminSubmissionRow | null>(null);

  return (
    <>
      <AdminPanel
        eyebrow="Review queue"
        title="Pending submissions"
        count={`${rows.length} pending`}
        note="Projects waiting for approval. They are not public coins until an admin approves them."
        rows={rows}
        searchPlaceholder="Search project, symbol, or chain"
        search={(row) => [row.name, row.symbol, row.chain, row.contactEmail, row.contactTelegram]}
        empty="No pending submissions right now."
        renderTable={(visibleRows) => (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Project Name</th>
                <th>Symbol</th>
                <th>Chain</th>
                <th>Submitted By</th>
                <th>Contact Email</th>
                <th>Contact Telegram</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th>Flag</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <LogoUrlAction logoUrl={row.logoUrl} name={row.name} />
                  </td>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.symbol ? `$${row.symbol}` : '—'}</td>
                  <td>{row.chain || '—'}</td>
                  <td>{row.submittedBy || '—'}</td>
                  <td>{row.contactEmail || '—'}</td>
                  <td>{row.contactTelegram || '—'}</td>
                  <td>{row.submittedAt}</td>
                  <td>
                    <StatusPill tone={row.status === 'pending' ? 'warning' : 'neutral'}>
                      {labelize(row.status)}
                    </StatusPill>
                  </td>
                  <td>{row.flag || '—'}</td>
                  <td>
                    <ActionGroup>
                      <button
                        type="button"
                        className="admin-icon-button neutral"
                        title="View full submission"
                        aria-label={`View full submission for ${row.name}`}
                        onClick={() => {
                          popover.setActivePopoverId(null);
                          setDetailRow(row);
                        }}
                      >
                        <Eye aria-hidden="true" />
                      </button>
                      <ConfirmAction
                        popover={popover}
                        popoverId={`submission-approve-${row.id}`}
                        action={updateAdminSubmission}
                        title="Approve submission"
                        tone="success"
                        message={`Approve ${row.name}? This will mark the submission as approved.`}
                        fields={{
                          submissionId: row.id,
                          status: 'approved',
                        }}
                      >
                        <Check aria-hidden="true" />
                      </ConfirmAction>
                      <ConfirmAction
                        popover={popover}
                        popoverId={`submission-reject-${row.id}`}
                        action={updateAdminSubmission}
                        title="Reject submission"
                        tone="danger"
                        message={`Reject ${row.name}? Add the reason so the review trail is clear.`}
                        fields={{
                          submissionId: row.id,
                          status: 'rejected',
                        }}
                        reasonName="reviewReason"
                        reasonPlaceholder="Reason required"
                      >
                        <X aria-hidden="true" />
                      </ConfirmAction>
                    </ActionGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      />
      {detailRow && <SubmissionDetailsModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </>
  );
}

function ListedCoinsTable({ rows, popover }: { rows: AdminCoinRow[]; popover: PopoverController }) {
  return (
    <AdminPanel
      eyebrow="Public listings"
      title="Listed coins"
      count={`${rows.length} latest`}
      note="Coins already visible or controlled by listing status. Boost and promote status show admin-only countdowns here."
      rows={rows}
      searchPlaceholder="Search coin, symbol, or chain"
      search={(row) => [row.name, row.symbol, row.chain, row.contactEmail, row.contactTelegram]}
      empty="No listed coins yet."
      renderTable={(visibleRows) => (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Project Name</th>
              <th>Symbol</th>
              <th>Chain</th>
              <th>Submitted By</th>
              <th>Contact Email</th>
              <th>Contact Telegram</th>
              <th>Date Submitted</th>
              <th>Status</th>
              <th>Boost Status</th>
              <th>Promote Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const suspended = row.status !== 'active';
              return (
                <tr key={row.id}>
                  <td>
                    <LogoUrlAction logoUrl={row.logoUrl} name={row.name} />
                  </td>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>${row.symbol}</td>
                  <td>{row.chain || '—'}</td>
                  <td>{row.submittedBy || '—'}</td>
                  <td>{row.contactEmail || '—'}</td>
                  <td>{row.contactTelegram || '—'}</td>
                  <td>{row.submittedAt}</td>
                  <td>
                    <StatusPill tone={suspended ? 'danger' : 'lime'}>
                      {suspended ? 'Suspended' : 'Active'}
                    </StatusPill>
                  </td>
                  <td>
                    {row.boost ? (
                      <StatusPill tone="purple">
                        {row.boost.status} — {row.boost.tier}x, {row.boost.remaining} left
                      </StatusPill>
                    ) : (
                      <span>1x / no boost</span>
                    )}
                  </td>
                  <td>
                    {row.promotion ? (
                      <StatusPill tone="amber">
                        Promoted — {row.promotion.remaining} left
                      </StatusPill>
                    ) : (
                      <span>Not promoted</span>
                    )}
                  </td>
                  <td>
                    <ActionGroup>
                      <CoinPageLinkAction coinId={row.id} name={row.name} />
                      <ConfirmAction
                        popover={popover}
                        popoverId={`coin-status-${row.id}`}
                        action={updateAdminCoin}
                        title={suspended ? 'Activate coin' : 'Suspend coin'}
                        tone={suspended ? 'success' : 'danger'}
                        message={`${suspended ? 'Activate' : 'Suspend'} ${row.name}? Status will change from ${suspended ? 'Suspended' : 'Active'} to ${suspended ? 'Active' : 'Suspended'}.`}
                        fields={{
                          coinId: row.id,
                          listingStatus: suspended ? 'active' : 'suspended',
                          category: row.category,
                        }}
                      >
                        {suspended ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                      </ConfirmAction>
                      <ConfirmAction
                        popover={popover}
                        popoverId={`coin-delete-${row.id}`}
                        action={deleteAdminCoin}
                        title="Delete coin"
                        tone="danger"
                        message={`Delete ${row.name}? This removes the coin from the database.`}
                        fields={{ coinId: row.id }}
                      >
                        <Trash2 aria-hidden="true" />
                      </ConfirmAction>
                      <BoostAction row={row} popover={popover} />
                      <PromoteAction row={row} popover={popover} />
                      <ConfirmAction
                        popover={popover}
                        popoverId={`coin-remove-boost-${row.id}`}
                        action={removeCoinBoost}
                        title="Cancel active boost"
                        tone="danger"
                        message={`Cancel the active boost for ${row.name}? This returns it to the 1x/no-boost baseline immediately.`}
                        fields={{ coinId: row.id }}
                        disabled={!row.boost}
                      >
                        <Square aria-hidden="true" />
                      </ConfirmAction>
                      <ConfirmAction
                        popover={popover}
                        popoverId={`coin-remove-promotion-${row.id}`}
                        action={removePromotedCoin}
                        title="Cancel promotion"
                        tone="danger"
                        message={`Cancel the active promotion for ${row.name}?`}
                        fields={{ coinId: row.id }}
                        disabled={!row.promotion}
                      >
                        <X aria-hidden="true" />
                      </ConfirmAction>
                    </ActionGroup>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    />
  );
}

function UsersTable({ rows, popover }: { rows: AdminUserRow[]; popover: PopoverController }) {
  return (
    <AdminPanel
      eyebrow="Accounts"
      title="User management"
      count={`${rows.length} latest`}
      note="Users are sorted newest first. Admins can edit, suspend, or permanently delete accounts."
      rows={rows}
      searchPlaceholder="Search name or email"
      search={(row) => [row.name, row.email, row.role, row.status, row.lastIp]}
      empty="No users found."
      renderTable={(visibleRows) => (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Projects Submitted</th>
              <th>Date Joined</th>
              <th>Last Active</th>
              <th>Last IP Used</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const suspended = row.status === 'suspended';
              return (
                <tr key={row.id}>
                  <td>
                    <span className={`admin-avatar tone-${row.avatarTone}`}>{row.avatar}</span>
                  </td>
                  <td>
                    <strong>{row.name || 'Unnamed user'}</strong>
                  </td>
                  <td>{row.email}</td>
                  <td>
                    <StatusPill tone={row.role === 'admin' ? 'lime' : 'neutral'}>
                      {labelize(row.role)}
                    </StatusPill>
                  </td>
                  <td>
                    <StatusPill tone={suspended ? 'danger' : 'lime'}>
                      {suspended ? 'Suspended' : 'Active'}
                    </StatusPill>
                  </td>
                  <td>{row.projectsSubmitted}</td>
                  <td>{row.joinedAt}</td>
                  <td>{row.lastActive}</td>
                  <td>{row.lastIp}</td>
                  <td>
                    <ActionGroup>
                      <UserEditAction row={row} popover={popover} />
                      <ConfirmAction
                        popover={popover}
                        popoverId={`user-status-${row.id}`}
                        action={updateAdminUser}
                        title={suspended ? 'Activate user' : 'Suspend user'}
                        tone={suspended ? 'success' : 'danger'}
                        message={`${suspended ? 'Activate' : 'Suspend'} ${row.email}? Status will change from ${suspended ? 'Suspended' : 'Active'} to ${suspended ? 'Active' : 'Suspended'}.`}
                        fields={{
                          userId: row.id,
                          name: row.name,
                          email: row.email,
                          role: row.role || 'user',
                          banned: suspended ? '' : 'on',
                        }}
                      >
                        {suspended ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                      </ConfirmAction>
                      <ConfirmAction
                        popover={popover}
                        popoverId={`user-delete-${row.id}`}
                        action={deleteAdminUser}
                        title="Delete user"
                        tone="danger"
                        message={`Delete ${row.email}? This removes the user account from the database.`}
                        fields={{ userId: row.id }}
                      >
                        <Trash2 aria-hidden="true" />
                      </ConfirmAction>
                    </ActionGroup>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    />
  );
}

function AdminPanel<T>({
  eyebrow,
  title,
  count,
  note,
  rows,
  searchPlaceholder,
  search,
  empty,
  renderTable,
}: {
  eyebrow: string;
  title: string;
  count: string;
  note: string;
  rows: T[];
  searchPlaceholder: string;
  search: (row: T) => string[];
  empty: string;
  renderTable: (rows: T[]) => ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(
    () =>
      normalizedQuery
        ? rows.filter((row) =>
            search(row).some((value) => value.toLowerCase().includes(normalizedQuery)),
          )
        : rows,
    [normalizedQuery, rows, search],
  );
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows = filteredRows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <section className="admin-panel">
      <div className="admin-panel-title">
        <div>
          <small>{eyebrow}</small>
          <h2>{title}</h2>
        </div>
        <span>{count}</span>
      </div>
      <p className="admin-panel-note">{note}</p>
      <div className="admin-table-tools">
        <label className="admin-search">
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
          />
        </label>
        <span>
          {filteredRows.length} result{filteredRows.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="admin-table-wrap">
        {visibleRows.length ? (
          renderTable(visibleRows)
        ) : (
          <div className="admin-empty-state">{empty}</div>
        )}
      </div>
      <div className="admin-pagination">
        <span>
          Page {safePage + 1} of {pageCount}
        </span>
        <div>
          <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            Previous
          </button>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function BoostAction({ row, popover }: { row: AdminCoinRow; popover: PopoverController }) {
  const [tier, setTier] = useState(50);
  const selected = boostPackages.find((item) => item.value === tier) || boostPackages[2];
  const message = row.boost
    ? `This will replace the active ${row.boost.tier}x boost, ${row.boost.remaining} remaining, with ${selected.label} for ${selected.detail.split(' · ')[1]}. Continue?`
    : `Give ${row.name} the ${selected.label} boost package for ${selected.detail}. Continue?`;

  return (
    <ConfirmAction
      popover={popover}
      popoverId={`coin-boost-${row.id}`}
      action={grantCoinBoost}
      title="Boost project"
      tone="boost"
      message={message}
      fields={{ coinId: row.id, multiplier: tier }}
      extra={
        <>
          <label>
            Boost tier
            <select value={tier} onChange={(event) => setTier(Number(event.target.value))}>
              {boostPackages.map((boost) => (
                <option key={boost.value} value={boost.value}>
                  {boost.label} — {boost.detail}
                </option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <input name="notes" placeholder="Internal notes" />
          </label>
        </>
      }
    >
      <Zap aria-hidden="true" />
    </ConfirmAction>
  );
}

function PromoteAction({ row, popover }: { row: AdminCoinRow; popover: PopoverController }) {
  const [days, setDays] = useState(1);
  const message = row.promotion
    ? `This will add ${days} day${days === 1 ? '' : 's'} to the active promotion (${row.promotion.remaining} remaining). Continue?`
    : `Promote ${row.name} for ${days} day${days === 1 ? '' : 's'} (${days * 24} hours). Continue?`;

  return (
    <ConfirmAction
      popover={popover}
      popoverId={`coin-promote-${row.id}`}
      action={addPromotedCoin}
      title="Promote project"
      tone="boost"
      message={message}
      fields={{ coinId: row.id, durationDays: days, priority: row.promotion?.priority || 1 }}
      extra={
        <>
          <label>
            Days
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(event) => setDays(Math.max(1, Number(event.target.value) || 1))}
            />
          </label>
          <small>{days * 24} hours will be added on save.</small>
          <label>
            Notes
            <input name="notes" placeholder="Internal notes" />
          </label>
        </>
      }
    >
      <Megaphone aria-hidden="true" />
    </ConfirmAction>
  );
}

function UserEditAction({ row, popover }: { row: AdminUserRow; popover: PopoverController }) {
  const [name, setName] = useState(row.name);
  const [email, setEmail] = useState(row.email);
  const [role, setRole] = useState(row.role || 'user');
  const changes = [
    name !== row.name ? `Name will change from ${row.name || 'blank'} to ${name || 'blank'}.` : '',
    email !== row.email ? `Email will change from ${row.email} to ${email}.` : '',
    role !== row.role ? `Role will change from ${row.role || 'user'} to ${role}.` : '',
  ].filter(Boolean);

  return (
    <ConfirmAction
      popover={popover}
      popoverId={`user-edit-${row.id}`}
      action={updateAdminUser}
      title="Edit user"
      tone="neutral"
      message={changes.length ? changes.join(' ') : 'No changes selected.'}
      fields={{
        userId: row.id,
        name,
        email,
        role,
        banned: row.status === 'suspended' ? 'on' : '',
      }}
      extra={
        <>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Role
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </>
      }
    >
      <Pencil aria-hidden="true" />
    </ConfirmAction>
  );
}

function SubmissionDetailsModal({
  row,
  onClose,
}: {
  row: AdminSubmissionRow;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return createPortal(
    <div className="admin-detail-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="admin-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-submission-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="admin-detail-modal-head">
          <div>
            <small>Full submission</small>
            <h2 id="admin-submission-details-title">{row.name}</h2>
            <p>
              {row.symbol ? `$${row.symbol}` : 'No symbol'} · {row.chain || 'No chain'} ·{' '}
              {row.submittedAt}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close submission details">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="admin-detail-sections">
          {row.details.map((section) => (
            <section className="admin-detail-section" key={section.title}>
              <h3>{section.title}</h3>
              <div>
                {section.rows.map((item) => (
                  <p key={`${section.title}-${item.label}`}>
                    <span>{item.label}</span>
                    <b>{item.value || '—'}</b>
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <details className="admin-raw-json">
          <summary>Raw submission JSON</summary>
          <pre>{row.rawData}</pre>
        </details>
      </section>
    </div>,
    document.body,
  );
}

function ConfirmAction({
  popover,
  popoverId,
  action,
  title,
  tone,
  message,
  fields,
  reasonName,
  reasonPlaceholder,
  extra,
  disabled,
  children,
}: {
  popover: PopoverController;
  popoverId: string;
  action: (formData: FormData) => Promise<void>;
  title: string;
  tone: 'neutral' | 'success' | 'danger' | 'boost';
  message: string;
  fields: Record<string, string | number>;
  reasonName?: string;
  reasonPlaceholder?: string;
  extra?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}) {
  const open = popover.activePopoverId === popoverId;
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverPosition = usePopoverPosition(open, buttonRef);
  const confirmLabel =
    status === 'saving' ? 'Saving...' : status === 'success' ? 'Saved' : 'Confirm';

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  return (
    <span className="admin-confirm-wrap">
      <button
        ref={buttonRef}
        type="button"
        className={`admin-icon-button ${tone}`}
        title={title}
        aria-label={title}
        disabled={disabled || isPending}
        onClick={() => {
          setFeedback('');
          setStatus('idle');
          popover.setActivePopoverId(open ? null : popoverId);
        }}
      >
        {children}
      </button>
      {open &&
        createPortal(
          <form
            className="admin-confirm-popover"
            style={popoverPosition}
            aria-busy={status === 'saving'}
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(async () => {
                setStatus('saving');
                setFeedback('Saving changes...');
                try {
                  await action(formData);
                  setStatus('success');
                  setFeedback('Saved. Refreshing...');
                  successTimerRef.current = setTimeout(() => {
                    popover.setActivePopoverId(null);
                    router.refresh();
                  }, 450);
                } catch (error) {
                  setStatus('error');
                  setFeedback(error instanceof Error ? error.message : 'Could not save changes.');
                }
              });
            }}
          >
            <strong>{title}</strong>
            <p>{message}</p>
            {Object.entries(fields).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            {reasonName && (
              <label>
                Reason
                <textarea name={reasonName} required placeholder={reasonPlaceholder} />
              </label>
            )}
            {extra}
            <div className="admin-confirm-actions">
              <button
                type="submit"
                className={`admin-confirm-submit ${status}`}
                disabled={isPending || status === 'saving' || status === 'success'}
              >
                {status === 'saving' && (
                  <span className="admin-button-spinner" aria-hidden="true" />
                )}
                {confirmLabel}
              </button>
              <button
                type="button"
                className="admin-confirm-cancel"
                disabled={isPending || status === 'saving' || status === 'success'}
                onClick={() => {
                  setStatus('idle');
                  setFeedback('');
                  popover.setActivePopoverId(null);
                }}
              >
                Cancel
              </button>
            </div>
            {feedback && <small className={`admin-confirm-feedback ${status}`}>{feedback}</small>}
          </form>,
          document.body,
        )}
    </span>
  );
}

function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="admin-icon-actions">{children}</div>;
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'lime' | 'warning' | 'danger' | 'amber' | 'purple';
}) {
  return <span className={`admin-status-pill ${tone}`}>{children}</span>;
}

function LogoUrlAction({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  if (!logoUrl) return <span className="admin-empty-cell">—</span>;

  return (
    <a
      className="admin-icon-button neutral"
      href={logoUrl}
      target="_blank"
      rel="noreferrer"
      title={`Open ${name} logo`}
      aria-label={`Open ${name} logo`}
    >
      <ExternalLink aria-hidden="true" />
    </a>
  );
}

function CoinPageLinkAction({ coinId, name }: { coinId: number; name: string }) {
  return (
    <a
      className="admin-icon-button neutral"
      href={`/coin/${coinId}`}
      target="_blank"
      rel="noreferrer"
      title={`Open ${name} coin page`}
      aria-label={`Open ${name} coin page`}
    >
      <ExternalLink aria-hidden="true" />
    </a>
  );
}

function usePopoverPosition(open: boolean, buttonRef: RefObject<HTMLButtonElement | null>) {
  const [position, setPosition] = useState<CSSProperties>({
    position: 'fixed',
    top: 16,
    left: 16,
  });

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const width = Math.min(340, window.innerWidth - 32);
      const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
      const shouldFlip = rect.bottom > window.innerHeight - 260;

      setPosition({
        position: 'fixed',
        width,
        left,
        top: shouldFlip
          ? Math.max(16, rect.top - 10)
          : Math.min(rect.bottom + 10, window.innerHeight - 16),
        transform: shouldFlip ? 'translateY(-100%)' : undefined,
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [buttonRef, open]);

  return position;
}

function labelize(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
