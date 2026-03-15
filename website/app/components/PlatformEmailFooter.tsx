/**
 * In-app display of the platform email footer branding.
 * "Sent via FertilityOS" with FertilityOS in blue–teal gradient linking to https://www.thefertilityos.com
 */

const FERTILITYOS_URL = "https://www.thefertilityos.com";

type Props = {
  className?: string;
};

export default function PlatformEmailFooter({ className = "" }: Props) {
  return (
    <p className={`text-xs text-slate-500 pt-4 border-t border-slate-200 ${className}`}>
      Sent via{" "}
      <a
        href={FERTILITYOS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold no-underline bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent hover:opacity-90"
      >
        FertilityOS
      </a>
    </p>
  );
}
