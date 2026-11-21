import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from "react-icons/fa6";

/**
 * Redbean's own profiles (from redbeanhospitality.com) as buttons in each network's official colour.
 * Instagram uses its brand gradient. Every link opens in a new tab.
 */
const socials = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/redbean_hospitality/",
    Icon: FaInstagram,
    style: { background: "linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)" },
  },
  { name: "Facebook", href: "https://www.facebook.com/Redbean-Hospitality-279167399278973/", Icon: FaFacebookF, style: { background: "#1877F2" } },
  { name: "YouTube", href: "https://www.youtube.com/channel/UC1f6QYMt07etGr822a0I2Gw", Icon: FaYoutube, style: { background: "#FF0000" } },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/red-bean-hospitality/", Icon: FaLinkedinIn, style: { background: "#0A66C2" } },
  { name: "X", href: "https://x.com/redbeanhospital", Icon: FaXTwitter, style: { background: "#000000", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.28)" } },
] as const;

export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2.5 ${className}`}>
      {socials.map(({ name, href, Icon, style }) => (
        <li key={name}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Redbean on ${name}`}
            style={style}
            className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Icon className="size-[18px]" aria-hidden />
            {name}
          </a>
        </li>
      ))}
    </ul>
  );
}
