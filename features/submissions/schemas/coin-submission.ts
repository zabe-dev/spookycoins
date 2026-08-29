import { coinCategories } from '@/features/coins/view';
import { SUPPORTED_NETWORK_IDS } from '@/features/coins/networks';
import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || /^https?:\/\/.+\..+/.test(value), 'Enter a valid URL.');

export const submissionBasicsSchema = z.object({
  logoUrl: optionalUrl,
  name: z.string().trim().min(2, 'Project name needs at least 2 characters.'),
  symbol: z
    .string()
    .trim()
    .min(1, 'Symbol is required.')
    .max(16, 'Keep symbols short.')
    .transform((value) => value.replace(/^\$/, '').toUpperCase()),
  description: z.string().trim().min(40, 'Description needs at least 40 characters.'),
  category: z.enum(
    coinCategories.filter((category) => category !== 'All') as [string, ...string[]],
  ),
  isPresale: z.boolean(),
});

export const submissionMarketSchema = z.object({
  network: z.enum([...SUPPORTED_NETWORK_IDS, 'other'] as unknown as [string, ...string[]]),
  contractAddress: z.string().trim().min(8, 'Contract address is required.'),
  launchDate: z.string().optional(),
  dexPairUrl: optionalUrl,
  marketProviderId: z.string().trim().optional(),
  website: optionalUrl,
  telegram: optionalUrl,
  x: optionalUrl,
  discord: optionalUrl,
  youtube: optionalUrl,
  whitepaper: optionalUrl,
});

export const submissionTrustSchema = z.object({
  kycProvider: z.string().trim().optional(),
  kycUrl: optionalUrl,
  auditProvider: z.string().trim().optional(),
  auditUrl: optionalUrl,
  contactEmail: z.string().trim().email('Use a real contact email.'),
  contactTelegram: z.string().trim().min(2, 'Telegram contact is required.'),
});

export const submissionPresaleSchema = z
  .object({
    presaleUrl: optionalUrl,
    presaleStart: z.string().optional(),
    presaleEnd: z.string().optional(),
    acceptedPayments: z.string().trim().optional(),
    softCap: z.string().trim().optional(),
    hardCap: z.string().trim().optional(),
    presalePrice: z.string().trim().optional(),
    contributionLimits: z.string().trim().optional(),
  })
  .partial();

export const coinSubmissionSchema = submissionBasicsSchema
  .merge(submissionMarketSchema)
  .merge(submissionTrustSchema)
  .merge(submissionPresaleSchema);

export type CoinSubmissionValues = z.input<typeof coinSubmissionSchema>;
