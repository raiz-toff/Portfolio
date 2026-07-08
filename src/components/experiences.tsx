import { experience } from "@/data/profile";
import { Panel, PanelHeader, PanelTitle, PanelTitleSup } from "./panel";
import { WorkExperience } from "./work-experience";

export default function Experiences() {
  return (
    <Panel id="experience">
      <PanelHeader>
        <PanelTitle>
          Experience
          <PanelTitleSup>({experience.length})</PanelTitleSup>
        </PanelTitle>
      </PanelHeader>

      <WorkExperience companies={experience} />
    </Panel>
  );
}
