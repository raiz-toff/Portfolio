import { identity, links, socialLinks } from "@/data/profile";
import { Panel, PanelContent } from "./panel";
import { PillHandle, PillIcon, PillLabel, pillClass } from "./pill";
import ShareMenu from "./share-menu";
import SoundLink from "./sound-link";
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

export default function SocialLinks() {
  return (
    <Panel>
      <h2 className="sr-only">Social links</h2>
      <PanelContent className="flex flex-wrap items-center gap-2">
        {socialLinks.map((item) => (
          <SoundLink
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.name} — ${item.handle}`}
            className={pillClass}
          >
            <PillIcon>{ICONS[item.name]}</PillIcon>
            <PillLabel>
              {item.name}
              <PillHandle>{item.handle}</PillHandle>
            </PillLabel>
          </SoundLink>
        ))}

        <SoundLink href={links.resume} aria-label="Resume — pdf" className={pillClass}>
          <PillIcon>
            <FileDownIcon />
          </PillIcon>
          <PillLabel>
            Resume
            <PillHandle>PDF</PillHandle>
          </PillLabel>
        </SoundLink>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <ShareMenu title={`${identity.name} — ${identity.role}`} url="/" />
      </PanelContent>
    </Panel>
  );
}
