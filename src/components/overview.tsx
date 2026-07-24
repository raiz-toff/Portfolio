import { identity, links } from "@/data/profile";
import { CurrentLocalTime } from "./current-local-time";
import { Item } from "./overview-item";
import { Panel, PanelContent } from "./panel";
import { PhoneItem } from "./phone-item";
import {
  BriefcaseIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  MarsIcon,
} from "./icons";

export default function Overview() {
  return (
    <Panel className="screen-line-bottom-none">
      <h2 className="sr-only">Overview</h2>
      <PanelContent className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
        <Item icon={<BriefcaseIcon />}>
          {identity.role}{" "}
          <span className="inline-flex items-center gap-1.5 text-led-green">
            <span className="led led-green" aria-hidden />
            {identity.status}
          </span>
        </Item>

        <CurrentLocalTime timeZone={identity.timeZone} />

        <Item icon={<MapPinIcon />}>
          {identity.location}
          <span className="text-muted-foreground">
            {" "}
            · roots in {identity.origin}
          </span>
        </Item>

        <PhoneItem phoneB64={identity.phoneB64} />

        <Item icon={<MailIcon />}>
          <a className="link break-all" href={`mailto:${identity.email}`}>
            {identity.email}
          </a>
        </Item>

        <Item icon={<GlobeIcon />}>
          <a className="link" href={links.projects}>
            Projects
          </a>
          <span className="text-muted-foreground"> · </span>
          <a className="link" href={links.blog}>
            Blog
          </a>
        </Item>

        <Item icon={<MarsIcon />}>{identity.pronouns}</Item>
      </PanelContent>

      {/* dashed vertical divider between the two columns (chanhdai.com) */}
      <div
        className="pointer-events-none absolute top-px bottom-0 left-1/2 -z-1 w-px -translate-x-[9px] bg-[linear-gradient(to_bottom,var(--line)_4px,transparent_2px)] bg-size-[1px_6px] bg-repeat-y max-sm:hidden"
        aria-hidden
      />
    </Panel>
  );
}
