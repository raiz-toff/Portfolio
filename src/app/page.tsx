import About from "@/components/about";
import Certifications from "@/components/certifications";
import Experiences from "@/components/experiences";
import GitHubContributions from "@/components/github-contributions";
import LabLog from "@/components/lab-log";
import Overview from "@/components/overview";
import { Separator } from "@/components/panel";
import ProfileHeader from "@/components/profile-header";
import Projects from "@/components/projects";
import SectionNav from "@/components/section-nav";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import SocialLinks from "@/components/social-links";
import TechStack from "@/components/tech-stack";

export default function Home() {
  return (
    <div id="top" className="relative isolate flex-1">
      <SiteHeader hasSectionNav />
      <SectionNav />
      <main className="max-w-screen overflow-x-clip px-2">
        <div className="mx-auto md:max-w-3xl">
          <ProfileHeader />
          <Separator />

          <Overview />
          <SocialLinks />
          <GitHubContributions />
          <Separator />

          <About />
          <Separator />

          <TechStack />
          <Separator />

          <Experiences />
          <Separator />

          <Certifications />
          <Separator />

          <LabLog />
          <Separator />

          <Projects />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
