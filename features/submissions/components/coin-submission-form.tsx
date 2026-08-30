'use client';

import { NETWORKS, SUPPORTED_NETWORK_IDS } from '@/features/coins/networks';
import type { NetworkId } from '@/features/coins/types';
import { coinCategories } from '@/features/coins/view';
import {
  coinSubmissionSchema,
  submissionBasicsSchema,
  submissionMarketSchema,
  submissionPresaleSchema,
  submissionTrustSchema,
  type CoinSubmissionValues,
} from '@/features/submissions/schemas/coin-submission';
import { Check } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { z } from 'zod';

const steps = ['Basics', 'Chain & links', 'Trust & contact', 'Review'] as const;

const initialValues: CoinSubmissionValues = {
  logoUrl: '',
  name: '',
  symbol: '',
  description: '',
  category: 'Memecoins',
  isPresale: false,
  network: 'solana',
  contractAddress: '',
  launchDate: '',
  dexPairUrl: '',
  marketProviderId: '',
  website: '',
  telegram: '',
  x: '',
  discord: '',
  youtube: '',
  whitepaper: '',
  kycProvider: '',
  kycUrl: '',
  auditProvider: '',
  auditUrl: '',
  contactEmail: '',
  contactTelegram: '',
  presaleUrl: '',
  presaleStart: '',
  presaleEnd: '',
  acceptedPayments: '',
  softCap: '',
  hardCap: '',
  presalePrice: '',
  contributionLimits: '',
};

type FieldErrors = Partial<Record<keyof CoinSubmissionValues, string>>;

export function CoinSubmissionForm({ userEmail }: { userEmail: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<CoinSubmissionValues>({
    ...initialValues,
    contactEmail: userEmail,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const activeStep = steps[stepIndex];
  const reviewItems = useMemo(() => buildReviewItems(values), [values]);

  function update<K extends keyof CoinSubmissionValues>(field: K, value: CoinSubmissionValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function goNext() {
    if (!validateStep()) return;
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function jumpTo(index: number) {
    if (index <= stepIndex || validateStep()) setStepIndex(index);
  }

  function validateStep() {
    const schema =
      stepIndex === 0
        ? submissionBasicsSchema
        : stepIndex === 1
          ? submissionMarketSchema
          : stepIndex === 2
            ? values.isPresale
              ? submissionTrustSchema.merge(submissionPresaleSchema)
              : submissionTrustSchema
            : coinSubmissionSchema;

    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    }

    setErrors(toFieldErrors(result.error));
    return false;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = coinSubmissionSchema.safeParse(values);

    if (!result.success) {
      setErrors(toFieldErrors(result.error));
      setStepIndex(0);
      return;
    }

    setErrors({});
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="submission-card submission-success">
        <span className="submission-success-icon">
          <Check aria-hidden="true" />
        </span>
        <p className="eyebrow">
          <span>●</span> Submission drafted
        </p>
        <h1>{values.name || 'Project'} is ready for review</h1>
        <p>
          This prototype does not save submissions yet, but the form data is now structured for the
          future database workflow: Requests → Review → Approve/Reject → Live.
        </p>
        <button
          className="submission-primary"
          type="button"
          onClick={() => {
            setSubmitted(false);
            setStepIndex(0);
          }}
        >
          Submit another project
        </button>
      </section>
    );
  }

  return (
    <section className="submission-card">
      <div className="submission-card-head">
        <div>
          <p className="eyebrow">
            <span>●</span> Submit a project
          </p>
          <h1>Add a coin to SpookyCoins</h1>
          <p>
            Send the details we need to review the project, resolve chart/DEX coverage later, and
            keep admin contact private.
          </p>
        </div>
        <div className="submission-status">
          <b>{activeStep}</b>
          <span>
            Step {stepIndex + 1} of {steps.length}
          </span>
        </div>
      </div>

      <div className="submission-steps" aria-label="Submission steps">
        {steps.map((step, index) => (
          <button
            key={step}
            className={index === stepIndex ? 'active' : index < stepIndex ? 'done' : ''}
            type="button"
            onClick={() => jumpTo(index)}
          >
            <span>{index + 1}</span>
            {step}
          </button>
        ))}
      </div>

      <form className="submission-form" onSubmit={submit}>
        {stepIndex === 0 && (
          <div className="submission-grid">
            <Field label="Logo URL" error={errors.logoUrl}>
              <input
                value={values.logoUrl}
                onChange={(event) => update('logoUrl', event.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Coin name" error={errors.name}>
              <input
                value={values.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Spooky Cat"
              />
            </Field>
            <Field label="Symbol" error={errors.symbol}>
              <input
                value={values.symbol}
                onChange={(event) => update('symbol', event.target.value)}
                placeholder="SPOOK"
              />
            </Field>
            <Field label="Category" error={errors.category}>
              <select
                value={values.category}
                onChange={(event) => update('category', event.target.value)}
              >
                {coinCategories
                  .filter((category) => category !== 'All')
                  .map((category) => (
                    <option key={category}>{category}</option>
                  ))}
              </select>
            </Field>
            <Field label="Description" error={errors.description} wide>
              <textarea
                value={values.description}
                onChange={(event) => update('description', event.target.value)}
                placeholder="Explain what the project is, who it is for, and why users should care."
              />
            </Field>
            <label className="submission-toggle">
              <input
                type="checkbox"
                checked={values.isPresale}
                onChange={(event) => update('isPresale', event.target.checked)}
              />
              <span />
              This is a presale project
            </label>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="submission-grid">
            <Field label="Chain / network" error={errors.network}>
              <select
                value={values.network}
                onChange={(event) => update('network', event.target.value)}
              >
                {([...SUPPORTED_NETWORK_IDS, 'other'] as NetworkId[]).map((networkId) => (
                  <option key={networkId} value={networkId}>
                    {NETWORKS[networkId].name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Contract address" error={errors.contractAddress}>
              <input
                value={values.contractAddress}
                onChange={(event) => update('contractAddress', event.target.value)}
                placeholder="0x... or chain address"
              />
            </Field>
            <Field label="Launch date/time UTC" error={errors.launchDate}>
              <input
                type="datetime-local"
                value={values.launchDate}
                onChange={(event) => update('launchDate', event.target.value)}
                disabled={values.isPresale}
              />
            </Field>
            <Field label="DEX pair URL" error={errors.dexPairUrl}>
              <input
                value={values.dexPairUrl}
                onChange={(event) => update('dexPairUrl', event.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="Market provider ID" error={errors.marketProviderId}>
              <input
                value={values.marketProviderId}
                onChange={(event) => update('marketProviderId', event.target.value)}
                placeholder="Optional generic ID"
              />
            </Field>
            {(['website', 'telegram', 'x', 'discord', 'youtube', 'whitepaper'] as const).map(
              (field) => (
                <Field key={field} label={linkLabels[field]} error={errors[field]}>
                  <input
                    value={values[field]}
                    onChange={(event) => update(field, event.target.value)}
                    placeholder="https://..."
                  />
                </Field>
              ),
            )}
          </div>
        )}

        {stepIndex === 2 && (
          <div className="submission-grid">
            <Field label="KYC provider" error={errors.kycProvider}>
              <input
                value={values.kycProvider}
                onChange={(event) => update('kycProvider', event.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="KYC certificate URL" error={errors.kycUrl}>
              <input
                value={values.kycUrl}
                onChange={(event) => update('kycUrl', event.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Audit provider" error={errors.auditProvider}>
              <input
                value={values.auditProvider}
                onChange={(event) => update('auditProvider', event.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="Audit report URL" error={errors.auditUrl}>
              <input
                value={values.auditUrl}
                onChange={(event) => update('auditUrl', event.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Contact email" error={errors.contactEmail}>
              <input
                type="email"
                value={values.contactEmail}
                onChange={(event) => update('contactEmail', event.target.value)}
                placeholder="team@example.com"
              />
            </Field>
            <Field label="Contact Telegram" error={errors.contactTelegram}>
              <input
                value={values.contactTelegram}
                onChange={(event) => update('contactTelegram', event.target.value)}
                placeholder="@projectteam"
              />
            </Field>

            {values.isPresale && (
              <div className="submission-presale-panel">
                <h2>Presale details</h2>
                <div className="submission-grid">
                  <Field label="Presale URL" error={errors.presaleUrl}>
                    <input
                      value={values.presaleUrl}
                      onChange={(event) => update('presaleUrl', event.target.value)}
                      placeholder="https://..."
                    />
                  </Field>
                  <Field label="Start date/time UTC" error={errors.presaleStart}>
                    <input
                      type="datetime-local"
                      value={values.presaleStart}
                      onChange={(event) => update('presaleStart', event.target.value)}
                    />
                  </Field>
                  <Field label="End date/time UTC" error={errors.presaleEnd}>
                    <input
                      type="datetime-local"
                      value={values.presaleEnd}
                      onChange={(event) => update('presaleEnd', event.target.value)}
                    />
                  </Field>
                  {(
                    [
                      'acceptedPayments',
                      'softCap',
                      'hardCap',
                      'presalePrice',
                      'contributionLimits',
                    ] as const
                  ).map((field) => (
                    <Field key={field} label={presaleLabels[field]} error={errors[field]}>
                      <input
                        value={values[field]}
                        onChange={(event) => update(field, event.target.value)}
                        placeholder="Optional"
                      />
                    </Field>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {stepIndex === 3 && (
          <div className="submission-review">
            {reviewItems.map((group) => (
              <div className="submission-review-card" key={group.title}>
                <h2>{group.title}</h2>
                {group.items.map((item) => (
                  <p key={item.label}>
                    <span>{item.label}</span>
                    <b>{item.value || '—'}</b>
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="submission-actions">
          <button
            className="submission-secondary"
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
          >
            Back
          </button>
          {stepIndex < steps.length - 1 ? (
            <button className="submission-primary" type="button" onClick={goNext}>
              Continue
            </button>
          ) : (
            <button className="submission-primary" type="submit">
              Send for review
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  error,
  wide,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? 'submission-field wide' : 'submission-field'}>
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

function toFieldErrors(error: z.ZodError): FieldErrors {
  return error.issues.reduce<FieldErrors>((fieldErrors, issue) => {
    const field = issue.path[0] as keyof CoinSubmissionValues | undefined;
    if (field) fieldErrors[field] = issue.message;
    return fieldErrors;
  }, {});
}

function buildReviewItems(values: CoinSubmissionValues) {
  return [
    {
      title: 'Project',
      items: [
        { label: 'Name', value: values.name },
        { label: 'Symbol', value: values.symbol ? `$${values.symbol}` : '' },
        { label: 'Category', value: String(values.category) },
        { label: 'Type', value: values.isPresale ? 'Presale' : 'Launched' },
      ],
    },
    {
      title: 'Chain',
      items: [
        { label: 'Network', value: NETWORKS[values.network as NetworkId].name },
        { label: 'Contract', value: values.contractAddress },
        { label: 'Launch', value: values.isPresale ? 'Presale project' : values.launchDate },
      ],
    },
    {
      title: 'Contact',
      items: [
        { label: 'Email', value: values.contactEmail },
        { label: 'Telegram', value: values.contactTelegram },
        { label: 'Website', value: values.website },
      ],
    },
  ];
}

const linkLabels = {
  website: 'Website',
  telegram: 'Telegram',
  x: 'X',
  discord: 'Discord',
  youtube: 'YouTube',
  whitepaper: 'Whitepaper',
};

const presaleLabels = {
  acceptedPayments: 'Accepted payments',
  softCap: 'Soft cap',
  hardCap: 'Hard cap',
  presalePrice: 'Presale price',
  contributionLimits: 'Contribution limits',
};
