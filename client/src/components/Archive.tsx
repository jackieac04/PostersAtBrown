import "../styles/Archive.css";
import { TriangleUpIcon } from "@chakra-ui/icons";
import "../styles/ImageCard.css";
import { ImageCard } from "./ImageCard";
import { Box, IconButton } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { fetchTags, scrollToTop } from "../functions/fetch";
import axios from "axios";
import Masonry from "masonry-layout";
import imagesLoaded from "imagesloaded";
import React from "react";
import { IPoster } from "./Happenings";
import { BACKEND } from "../vars";

export default function Archive() {
  const [searchResults, setSearchResults] = useState<IPoster[]>([]);
  const [, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [posters, setPosters] = useState<{ [key: string]: IPoster[] }>({});

  useEffect(() => {
    for (const year of Object.keys(posters)) {
      imagesLoaded(`#grid-${year}`, function () {
        new Masonry(`#grid-${year}`, {
          columnWidth: 34,
          itemSelector: ".image-card",
          gutter: 23,
        });
      });
    }
  }, [searchResults]);

  function mapPosters(archivePosters: IPoster[]) {
    const mappedPosters: { [key: string]: IPoster[] } = {};
    for (const poster of archivePosters) {
      //keys have to be strings, so number date is converted to string automatically
      if (!mappedPosters[poster.startDate[0]]) {
        mappedPosters[poster.startDate[0]] = [];
      }
      mappedPosters[poster.startDate[0]].push(poster);
    }
    setPosters(mappedPosters);
    // console.log(mappedPosters);
  }

  async function getArchive() {
    try {
      const url = BACKEND + "posters/archive";
      const res = await axios.get<IPoster[]>(url);
      mapPosters(res.data);
      return Promise.resolve(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.log(error.response.data.message);
        console.log(error);
        return Promise.resolve(
          `Error in fetch: ${error.response.data.message}`
        );
      } else {
        console.log("Network error or other issue");
        return Promise.resolve("Error in fetch: Network error or other issue");
      }
    }
  }

  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        const tagsData = await fetchTags();
        setAllTags(tagsData);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchAllTags();

    const images = () => {
      getArchive().then((data) => {
        setSearchResults(data);
        setIsLoading(false);
      });
    };
    images();
  }, []);

  return (
    <>
      {isLoading && (
        <div className="loading-screen">
          <img className="loading-gif" src="/loading.gif" />
        </div>
      )}
      <main className="archive" style={{ height: "fit-content" }}>
        {Object.keys(posters)
          .reverse()
          .map((year) => {
            return (
              <React.Fragment key={year}>
                <h1 id="year">{year}</h1>
                <div className="archive-grid" id={`grid-${year}`}>
                  {posters[year].map((item, index) => (
                    <Box key={index}>
                      <ImageCard
                        title={item.title!}
                        content={item.content!}
                        startDate={item.startDate!}
                        endDate={item.endDate!}
                        location={item.location}
                        link={item.link}
                        description={item.description}
                        tags={item.tags}
                        recurs={item.isRecurring!}
                        id={item.id}
                      />
                    </Box>
                  ))}
                </div>
              </React.Fragment>
            );
          })}
        <IconButton
          className="scroll-top"
          color="white"
          backgroundColor="var(--dark-purple100)"
          icon={<TriangleUpIcon id="triangle-icon-up" />}
          aria-label={"scrolls user to bottom of page"}
          onClick={scrollToTop}
        />
      </main>
    </>
  );
}
