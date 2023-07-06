import metascraper from "metascraper";
import metascraperTitle from "metascraper-title";
import metascraperImage from "metascraper-image";
import metascraperDescription from "metascraper-description";

export const scrapeMetadata = async (link: string) => {
  console.log(link);

  try {
    const response = await fetch(link);
    const html = await response.text();
    const url = response.url;
    const metadata = await metascraper([
      metascraperTitle(),
      metascraperImage(),
      metascraperDescription(),
    ])({ html, url });

    return { ...metadata, url };
  } catch (err) {
    return null;
  }
};
