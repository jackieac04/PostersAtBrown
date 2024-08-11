import {
  Box,
  Button,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
} from "@chakra-ui/react";
import "../styles/Happenings.css";
import "../styles/Modal.css";
import "../styles/ImageCard.css";
import { Search2Icon, TriangleUpIcon } from "@chakra-ui/icons";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRecoilState } from "recoil";
import {
  profileState,
  searchResultsState,
  searchState,
  tagsState,
} from "./atoms/atoms";
import { classNameTag, fetchTags, scrollToTop } from "../functions/fetch";
import Masonry from "masonry-layout";
import imagesLoaded from "imagesloaded";
import { ImageCard } from "./ImageCard";
import { BACKEND } from "../vars";

export interface IPoster {
  content: string;
  title: string;
  location?: string;
  startDate: number[];
  endDate?: number[];
  isRecurring: string;
  link?: string;
  description?: string;
  tags?: Set<string>;
  id: string;
  createdAt: number[];
  isDraft: boolean;
}

export async function getPosters() {
  try {
    const url = BACKEND + "posters/upcoming";
    const res = await axios.get<IPoster[]>(url);
    return Promise.resolve(res.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.log(error.response.data.message);
      console.log(error);
      return Promise.resolve(`Error in fetch: ${error.response.data.message}`);
    } else {
      console.log("Network error or other issue:", error.message);
      return Promise.resolve("Error in fetch: Network error or other issue");
    }
  }
}

export async function getNewestPosters() {
  try {
    const url = BACKEND + "posters/upcomingnew";
    const res = await axios.get<IPoster[]>(url);
    return Promise.resolve(res.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.log(error.response.data.message);
      console.log(error);
      return Promise.resolve(`Error in fetch: ${error.response.data.message}`);
    } else {
      console.log("Network error or other issue:", error.message);
      return Promise.resolve("Error in fetch: Network error or other issue");
    }
  }
}

async function getRelevantPosters(id: string) {
  try {
    const url = BACKEND + "posters/relevant?userId=" + id;
    const res = await axios.get<IPoster[]>(url);
    return Promise.resolve(res.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.log(error.response.data.message);
      console.log(error);
      return Promise.resolve(`Error in fetch: ${error.response.data.message}`);
    } else {
      console.log("Network error or other issue:", error.message);
      return Promise.resolve("Error in fetch: Network error or other issue");
    }
  }
}

export default function Happenings() {
  const [sortPosters, setSortPosters] = useState<string>("soonest");
  const [searchInput, setSearchInput] = useRecoilState(searchState);
  const [searchResults, setSearchResults] = useRecoilState(searchResultsState);
  const [showTags, setShowTags] = useState<boolean>(false); //shows the tags modal
  const [allTags, setAllTags] = useState<string[]>([]); //all tags in database
  const [tags, setTags] = useRecoilState<Set<string>>(tagsState); //list of tags user clicked
  const [isLoading, setIsLoading] = useState(true);
  const [profile] = useRecoilState(profileState);
  const gridRef = useRef(null);

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
    if (searchInput.length > 0 || tags.size > 0) {
      getSearchResults();
    } else {
      getPosters().then((data) => {
        setSearchResults(data);
        setIsLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    // console.log(profile);
    setIsLoading(true);
    if (sortPosters === "newest") {
      getNewestPosters().then((data) => {
        setSearchResults(data);
        setIsLoading(false);
      });
    } else if (sortPosters === "relevance") {
      getRelevantPosters(profile.id).then((data) => {
        setSearchResults(data);
        setIsLoading(false);
      });
    } else {
      // if user selects soonest or sort, which should sort by soonest by default

      getPosters().then((data) => {
        console.log("data");
        console.log(data);
        setSearchResults(data);
        setIsLoading(false);
      });
    }
  }, [profile, setSearchResults, sortPosters]);

  useEffect(() => {
    // console.log(searchResults);
    if (gridRef.current) {
      imagesLoaded(gridRef.current, function () {
        // console.log("all images are loaded");
        if (gridRef.current) {
          new Masonry(gridRef.current, {
            columnWidth: 34,
            itemSelector: ".image-card",
            gutter: 23,
          });
        }
      });
    }
  }, [searchResults]);

  const onClick = (tag: string) => {
    // if in tags list, take out
    setTags((prevTags) => {
      // using functional form of setTags so that onClick is updating the actual latest state of tags; otherwise always a step behind
      const updatedTags = new Set(prevTags); // Create a new set from the previous tags

      if (updatedTags.has(tag)) {
        updatedTags.delete(tag); // If the tag exists, remove it from the set
      } else {
        updatedTags.add(tag); // If the tag doesn't exist, add it to the set
      }

      //  console.log(updatedTags);
      return updatedTags; // Return the updated set
    });
  };

  const getAllResults = () => {
    getPosters().then((data) => {
      setSearchResults(data);
      setSearchInput("");
      setTags(new Set());
      setIsLoading(false);
    });
  };

  const addTagsToSearch = () => {
    setShowTags(false);
    getSearchResults();
  };

  const getSearchResults = async () => {
    if ((searchInput == "" || searchInput == " ") && tags.size == 0) {
      getAllResults();
    } else if ((searchInput == "" || searchInput == " ") && tags.size > 0) {
      let tagString = "";
      tags.forEach((tag) => {
        tagString += tag + ",";
      });
      tagString = tagString.slice(0, -1);

      try {
        const response = await fetch(
          BACKEND + `posters/tag?tag=${tagString}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const results: IPoster[] = await response.json();
        // console.log(results);
        setSearchResults(results);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    } else {
      try {
        setIsLoading(true);
        let tagString = "";
        tags.forEach((tag) => {
          tagString += tag + ",";
        });
        tagString = tagString.slice(0, -1);

        const response = await fetch(
          BACKEND + `posters/term?term=${searchInput}&tags=${tagString}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const results: IPoster[] = await response.json();

        setSearchResults(results);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    }
  };

  return (
    <>
      {isLoading && (
        <div className="loading-screen">
          <img className="loading-gif" src="/loading.gif" />
        </div>
      )}
      <main className="happenings">
        <div className="search-filter-fixed">
          <div
            style={{
              display: "flex",
            }}
          >
            <div
              className="browse-search-bar"
              style={{ justifyContent: "space-between" }}
            >
              <Search2Icon boxSize={5} width={14} />
              <input
                className="browse-input"
                placeholder="Search"
                type="text"
                value={searchInput}
                onChange={(ev) => setSearchInput(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    getSearchResults();
                  }
                }}
              />
              <Box w="10vw" display="flex" justifyContent="right">
                <Button
                  width="72px"
                  className="browse-select"
                  fontSize="18px"
                  height="48px"
                  color="white"
                  alignItems="center"
                  border="none"
                  onClick={() => setShowTags(true)}
                >
                  Tags
                </Button>
              </Box>
            </div>
            <Button className="all-results" onClick={getAllResults}>
              All Results
            </Button>
          </div>

          <Box w="140px">
            <Select
              className="sort-select"
              fontSize="18px"
              height="48px"
              width="140px"
              placeholder="Sort"
              alignItems="center"
              border="none"
              textAlign="right"
              value={sortPosters}
              onChange={(ev) => setSortPosters(ev.target.value)}
            >
              <option value="soonest">Soonest</option>
              <option value="newest">Newest</option>
              <option value="relevance">Relevance</option>
            </Select>
          </Box>
        </div>

        <div className="modal-font">
          {showTags && (
            <Modal isOpen={true} onClose={() => setShowTags(false)}>
              <ModalOverlay className="modal-overlay" />
              <ModalBody className="modal-body">
                <ModalContent className="tag-modal-content">
                  <ModalHeader className="modal-header">
                    Choose Tags
                  </ModalHeader>
                  <ModalCloseButton
                    className="close-button"
                    onClick={() => setShowTags(false)}
                  />
                  <div
                    className="tags-container"
                    style={{
                      alignItems: "center",
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      gap: "2vw",
                    }}
                  >
                    <div
                      className="tags-div"
                      style={{
                        paddingLeft: "5%",
                        width: "100%",
                      }}
                    >
                      {allTags.map((tag, index) => {
                        const isSelected = tags.has(tag);
                        const tagClass = isSelected
                          ? "selected-tag" + " " + classNameTag(index)
                          : classNameTag(index);

                        return (
                          <div
                            key={tag}
                            className={tagClass}
                            onClick={() => onClick(tag)}
                          >
                            {tag}
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      className="final-upload-button"
                      onClick={addTagsToSearch}
                      padding={"8px 18px"}
                    >
                      Add Tags to Search
                    </Button>
                  </div>
                </ModalContent>
              </ModalBody>
            </Modal>
          )}
        </div>
        <div className="grid" ref={gridRef}>
          {searchInput !== "" && searchResults.length === 0 && (
            <h1 className="none">No results to display for this search term</h1>
          )}

          {searchResults.length > 0 &&
            searchResults.map((item, index) => (
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
