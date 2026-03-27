import BrandIcon from '@/components/BrandIcon';

const DISCORD_INVITE_URL = 'https://discord.com/invite/7eK2QAsp23';

type DiscordInviteCardProps = {
  title?: string;
  description?: string;
  buttonLabel?: string;
  className?: string;
};

export default function DiscordInviteCard({
  title = 'Entra no server do Discord',
  description = 'Recebe avisos, tira duvidas e acompanha a comunidade da MatemáticaTop num só sitio.',
  buttonLabel = 'Entrar no Discord',
  className = '',
}: DiscordInviteCardProps) {
  return (
    <div
      className={`rounded-2xl border border-[#000000]/15 bg-gradient-to-br from-[#000000]/5 to-[#4a4a4a]/10 p-5 shadow-sm ${className}`.trim()}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#000000]/10 shadow-sm">
          <BrandIcon token="discord" size={28} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[#000000]">{title}</p>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#000000] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg"
          >
            {buttonLabel}
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h4m0 0v4m0-4L10 14" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9v8a2 2 0 002 2h8" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
