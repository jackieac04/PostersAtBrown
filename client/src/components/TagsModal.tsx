import { Button } from "@chakra-ui/react";
import "../styles/Modal.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { classNameTag, fetchTags } from "../functions/fetch";
import {
  modalOpenState,
  posterSrcState,
  posterState,
  refreshState,
  searchResultsState,
} from "./atoms/atoms";
import { useRecoilState, useSetRecoilState } from "recoil";
import { getPosters } from "./Happenings";
import { IPosterObject } from "./CreateImageModal";
import ErrorPopup from "./ErrorPopup";
import { BACKEND } from "../vars";

interface tagsProps {
  onClose: () => void;
  onBack: () => void;
  draftId: string;
  setShowTags: React.Dispatch<React.SetStateAction<boolean>>;
  updatePoster: (poster: IPosterObject, id: string) => Promise<unknown>;
  isDraft: boolean;
}

export default function TagsModal({
  onClose,
  onBack,
  draftId,
  setShowTags,
  updatePoster,
  isDraft,
}: tagsProps) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [, setSearchResults] = useRecoilState(searchResultsState);
  const [poster, setPoster] = useRecoilState<IPosterObject>(posterState);
  const [, setPosterSrc] = useRecoilState(posterSrcState);
  const [refresh, setRefresh] = useRecoilState(refreshState);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [errorPopup, setErrorPopup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const setModalOpen = useSetRecoilState(modalOpenState);

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
    selectSuggestedTags(poster.tags!);
  }, [poster]);

  useEffect(() => {
    console.log("Poster updated:", poster);
  }, [poster]);

  useEffect(() => {
    const getPoster = async () => {
      console.log(draftId);
      console.log(poster.id);
      try {
        let id;
        if (poster.id === undefined) {
          id = draftId;
        } else {
          id = poster.id;
        }
        console.log(id);
        const url = BACKEND + "posters/" + id;
        const res = await fetch(url);
        console.log(res);
        if (res.ok) {
          const posterData = await res.json();
          console.log("posterData: " + posterData);
          // posterdata doesnt print but res.ok does :(
          if (posterData.message != "Poster not found") {
            console.log("this is a poster");
            return "poster";
          } else {
            try {
              const url = BACKEND + "drafts/" + draftId ? draftId : poster.id;
              const res = await fetch(url);
              // console.log(res);
              if (res.ok) {
                const posterData = await res.json();
                if (posterData.message != "Poster not found") {
                  console.log("this is a draft");
                  return "draft";
                }
              }
            } catch (error) {
              return JSON.stringify(error);
            }
          }
        }
      } catch (error) {
        return JSON.stringify(error);
      }
    };
    getPoster();
  }, []);

  // const handleChange = (
  //   value: string[] | string | Set<string>,
  //   property: keyof IPosterObject,
  //   callback?: () => void
  // ) => {
  //   setPoster((prevPoster) => {
  //     const updatedValue =
  //       value instanceof Set
  //         ? { [property]: Array.from(value) }
  //         : { [property]: value };
  //     const newPoster = { ...prevPoster, ...updatedValue };

  //     if (callback) {
  //       callback();
  //     }

  //     console.log("Updated Poster in handleChange:", newPoster);
  //     return newPoster;
  //   });
  // };

  function selectSuggestedTags(currTags: Set<string>) {
    setTags((prevTags) => {
      const updatedTags = new Set(prevTags);
      currTags.forEach((tag) => updatedTags.add(tag));
      return updatedTags;
    });
  }

  const onClick = (tag: string) => {
    setTags((prevTags) => {
      const updatedTags = new Set(prevTags);
      if (updatedTags.has(tag)) {
        updatedTags.delete(tag);
      } else {
        updatedTags.add(tag);
      }
      return updatedTags;
    });
  };

  const createPoster = async () => {
    setIsLoading(true);
    setDisabled(true);

    const updatedPoster = {
      ...poster,
      tags: Array.from(tags),
    };

    setPoster(updatedPoster);
    console.log(updatedPoster.id);
    console.log(draftId);
    await updatePoster(
      updatedPoster,
      updatedPoster.id ? updatedPoster.id : draftId
    );

    console.log("updated poster");
    console.log(updatedPoster);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      console.log(draftId);
      const url = draftId
        ? BACKEND + `posters/create/${draftId}`
        : BACKEND + `posters/create/${updatedPoster.id}`;
      const formData = new FormData();

      tags.forEach((tag) => {
        formData.append("tags[]", tag);
      });

      for (const key in updatedPoster) {
        if (updatedPoster[key] && key !== "tags") {
          const value = updatedPoster[key];
          if (typeof value === "string") {
            formData.append(key, value);
          }
        }
      }
      const res = await axios.post(url, formData, config);
      setRefresh(!refresh);
      getPosters().then((data) => setSearchResults(data));
      setShowTags(false);
      setModalOpen("");
      setPoster({});
      setPosterSrc("");
      setIsLoading(false);
      return Promise.resolve(res.data.data);
    } catch (error) {
      setErrorPopup(true);
      if (axios.isAxiosError(error) && error.response) {
        return Promise.resolve(
          `Error in fetch: ${error.response.data.message}`
        );
      } else {
        return Promise.resolve("Error in fetch: Network error or other issue");
      }
    }
  };

  const editPoster = async () => {
    setIsLoading(true);
    setDisabled(true);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      console.log(poster.id);
      const url = BACKEND + `posters/update/${
        draftId ? draftId : poster.id
      }`;
      console.log(url);
      const formData = new FormData();

      tags.forEach((tag) => {
        formData.append("tags[]", tag);
      });

      for (const key in poster) {
        if (poster[key] && key !== "tags") {
          const value = poster[key];
          if (typeof value === "string") {
            formData.append(key, value);
          }
        }
      }

      const res = await axios.put(url, formData, config);
      console.log(res.data.data);
      setRefresh(!refresh);
      getPosters().then((data) => setSearchResults(data));
      setShowTags(false);
      setModalOpen("");
      setPosterSrc("");
      setPoster({});
      setIsLoading(false);
      return Promise.resolve(res.data.data);
    } catch (error) {
      console.log("made it here!");
      console.log(error);
      setErrorPopup(true);
      if (axios.isAxiosError(error) && error.response) {
        return Promise.resolve(
          `Error in fetch: ${error.response.data.message}`
        );
      } else {
        return Promise.resolve("Error in fetch: Network error or other issue");
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
      {errorPopup && <ErrorPopup setClose={setErrorPopup} />}
      <div className="tags-container">
        <div className="tags-div">
          {allTags.map((tag, index) => {
            const isSelected = tags.has(tag);
            const tagClass = isSelected
              ? "selected-tag" + " " + classNameTag(index)
              : classNameTag(index);
            return (
              <div key={tag} className={tagClass} onClick={() => onClick(tag)}>
                {tag}
              </div>
            );
          })}
        </div>
        <div className="final-save-div">
          <Button
            style={{ backgroundColor: "var(--dark-purple100)" }}
            onClick={onBack}
            className={"final-upload-button"}
          >
            Back
          </Button>
          {isDraft ? (
            <div>
              <Button
                style={{
                  marginRight: "1vw",
                }}
                className="secondary-button"
                onClick={editPoster}
                disabled={disabled}
              >
                Save Draft & Exit
              </Button>
              <Button
                style={{ backgroundColor: "var(--dark-purple100)" }}
                className="final-upload-button"
                onClick={createPoster}
                disabled={disabled}
              >
                Create Poster
              </Button>
            </div>
          ) : (
            <Button
              style={{
                backgroundColor: "var(--dark-purple100)",
                color: "white !important",
              }}
              className="final-upload-button"
              onClick={editPoster}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
