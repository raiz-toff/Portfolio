import { identity, links, socialLinks } from "@/data/profile";
import { Panel, PanelContent } from "./panel";
import ShareMenu from "./share-menu";
import SoundLink from "./sound-link";
import Tooltip from "./tooltip";
import {
  AwardIcon,
  BookOpenIcon,
  CameraIcon,
  FileDownIcon,
  GitHubIcon,
  LinkedInIcon,
} from "./icons";

const ICONS: Record<string, React.ReactNode> = {
  GitHub: <GitHubIcon />,
  LinkedIn: <LinkedInIcon />,
  Credly: <AwardIcon />,
  "Lab Notes": <BookOpenIcon />,
  Gallery: <CameraIcon />,
};

const buttonClass =
  "relative flex size-8 items-center justify-center rounded-lg border bg-background text-foreground/80 transition-[background-color,scale] duration-150 ease-out after:absolute after:-inset-1 after:content-[''] hover:bg-muted active:scale-[0.96] [&_svg]:size-4";

export default function SocialLinks() {
  return (
    <Panel>
      <h2 className="sr-only">Social links</h2>
      <PanelContent className="flex flex-wrap items-center gap-2">
        {socialLinks.map((item) => (
          <Tooltip key={item.name} label={`${item.name} (${item.handle})`}>
            <SoundLink
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.name} — ${item.handle}`}
              className={buttonClass}
            >
              {ICONS[item.name]}
            </SoundLink>
          </Tooltip>
        ))}

        <Tooltip label="Resume (pdf)">
          <SoundLink href={links.resume} aria-label="Resume — pdf" className={buttonClass}>
            <FileDownIcon />
          </SoundLink>
        </Tooltip>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <ShareMenu title={`${identity.name} — ${identity.role}`} url="/" />
      </PanelContent>
    </Panel>
  );
}
