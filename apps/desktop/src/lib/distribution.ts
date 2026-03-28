export type DistributionChannel = 'store' | 'github' | 'homebrew' | 'dev';

type DistributionConfig = {
  channel: DistributionChannel;
  showSupportCta: boolean;
  supportUrl: string;
};

const DEFAULT_SUPPORT_URL =
  'https://buymeacoffee.com/filegap?utm_source=filegap-desktop&utm_medium=app&utm_campaign=support_cta';

function normalizeDistributionChannel(value: string | undefined): DistributionChannel {
  switch ((value ?? '').trim().toLowerCase()) {
    case 'store':
      return 'store';
    case 'github':
      return 'github';
    case 'homebrew':
      return 'homebrew';
    default:
      return 'dev';
  }
}

export function getDistributionConfig(): DistributionConfig {
  const channel = normalizeDistributionChannel(import.meta.env.VITE_APP_DISTRIBUTION);

  return {
    channel,
    showSupportCta: channel !== 'store',
    supportUrl: DEFAULT_SUPPORT_URL,
  };
}
