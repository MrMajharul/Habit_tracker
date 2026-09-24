import { HadithPageClient } from "@/components/hadith/hadith-page-client";
import { hadithService } from "@/services/hadith/hadith-service";

export const metadata = {
  title: "Hadith Collections",
  description: "Browse verified, authentic Hadiths from source-controlled collections.",
};

export default async function HadithPage() {
  const hadiths = await hadithService.getAllHadith();
  return <HadithPageClient initialHadiths={hadiths} />;
}
