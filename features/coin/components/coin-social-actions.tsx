import { Icon as IconifyIcon } from '@iconify/react';
import { Flag, Share2 } from 'lucide-react';
import type { CoinProjectLink } from '@/features/coins/types';

type SocialKind = 'share' | 'report';
type ProjectLinkKind = CoinProjectLink['type'];

const icons = {
  share: Share2,
  report: Flag,
};

const projectLinkIcons = {
  website: 'akar-icons:link-chain',
  telegram: 'akar-icons:telegram-fill',
  x: 'akar-icons:x-fill',
  discord: 'akar-icons:discord-fill',
  github: 'akar-icons:github-fill',
  whitepaper: 'akar-icons:file',
};

const projectLinkLabels = {
  website: 'Website',
  telegram: 'Telegram',
  x: 'X',
  discord: 'Discord',
  github: 'GitHub',
  whitepaper: 'Whitepaper',
};

function Icon({ kind }: { kind: SocialKind }) {
  const SocialIcon = icons[kind];
  return <SocialIcon aria-hidden="true" />;
}

function ProjectLinkIcon({ kind }: { kind: ProjectLinkKind }) {
  return <IconifyIcon icon={projectLinkIcons[kind]} aria-hidden="true" />;
}

export function CoinSocialActions({
  links = [],
  onShare,
  onReport,
}: {
  links?: CoinProjectLink[];
  onShare: () => void;
  onReport: () => void;
}) {
  return (
    <div className="coin-social-actions">
      {links.length > 0 && (
        <div className="official-links">
          {links.map((link) => (
            <a
              className={`project-link-action project-link-${link.type}`}
              href={link.url}
              key={`${link.type}-${link.url}`}
              target="_blank"
              rel="noreferrer"
            >
              <ProjectLinkIcon kind={link.type} />
              <span>{projectLinkLabels[link.type]}</span>
            </a>
          ))}
        </div>
      )}
      <div className="coin-utilities">
        <button className="share-action" type="button" onClick={onShare} aria-label="Share coin">
          <Icon kind="share" />
          <span>Share</span>
        </button>
        <button className="report-action" type="button" onClick={onReport} aria-label="Report coin">
          <Icon kind="report" />
          <span>Report</span>
        </button>
      </div>
    </div>
  );
}
