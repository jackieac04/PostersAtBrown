import {
  Box,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Textarea,
} from "@chakra-ui/react";
import "../styles/Modal.css";
import { useEffect, useState } from "react";
import axios from "axios";
import TagsModal from "./TagsModal";
import {
  modalOpenState,
  posterSrcState,
  posterState,
  profileState,
  refreshState,
} from "./atoms/atoms";
import { useRecoilState } from "recoil";
import PopupModal from "./PopupModal";
import { BACKEND } from "../vars";

export interface IPosterObject {
  id: string;
  content?: string;
  title?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isRecurring?: string;
  link?: string;
  description?: string;
  tags?: Set<string> | string[];
}

export default function CreateImageModal() {
  const [showTags, setShowTags] = useState<boolean>(false);
  const [posterSrc, setPosterSrc] = useRecoilState(posterSrcState);
  const [poster, setPoster] = useRecoilState<IPosterObject>(posterState);
  const [draftId, setDraftId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useRecoilState<string>(modalOpenState);
  const [popModalOpen, setPopModalOpen] = useState<boolean>(false);
  const [profile] = useRecoilState(profileState);
  const [refresh, setRefresh] = useRecoilState(refreshState);
  const [isDraft, setIsDraft] = useState<boolean>(false);
  const [isContent, setIsContent] = useState<boolean>(false);

  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    //defaults to current date at 11:59PM + ensures startDate will always be filled with some value
    const todayDateTime = yyyy + "-" + mm + "-" + dd + "T23:59";
    // console.log(poster);
    setPoster({ ...poster, startDate: todayDateTime, isRecurring: "NEVER" });
  }, []);

  const getPoster = async () => {
    setIsLoading(true);
    // console.log(draftId);
    // console.log(poster.id);
    try {
      let id;
      if (poster.id === undefined) {
        id = draftId;
      } else {
        id = poster.id;
      }
      const url = BACKEND + "posters/" + id;
      const res = await fetch(url);
      if (res.ok) {
        const posterData = await res.json();
        if (posterData.message != "Poster not found") {
          setIsDraft(Boolean(posterData.data.isDraft));
          setIsLoading(false);
          return "poster";
        } else {
          try {
            const url = BACKEND + "drafts/" + draftId ? draftId : poster.id;
            const res = await fetch(url);
            if (res.ok) {
              const posterData = await res.json();
              if (posterData.message != "Poster not found") {
                setIsDraft(true);
                setIsLoading(false);
                return "draft";
              }
            }
          } catch (error) {
            return JSON.stringify(error);
          }
        }
      }
    } catch (error) {
      return undefined;
    }
  };

  const handleChange = (
    value: string[] | string | Set<string>,
    property: keyof IPosterObject,
    callback?: () => void
  ) => {
    // using functional form of setPoster so that it updates using the current stored state in poster
    setPoster((prevPoster) => {
      let updatedValue: {
        [x: string]: string[] | Set<string> | string;
      };
      if (value instanceof Set) {
        updatedValue = { [property]: Array.from(value) };
      } else {
        updatedValue = { [property]: value };
      }

      const newPoster = {
        ...prevPoster,
        ...updatedValue,
      };

      if (callback) {
        callback();
      }

      // console.log(JSON.stringify(newPoster));
      return newPoster;
    });

    return poster;
  };

  const setCVFields = async (id: string) => {
    setIsLoading(true);
    try {
      const url = BACKEND + "drafts/" + id;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const res = await response.json();
      setPoster({
        ...poster,
        title: res.data.title,
        description: res.data.description,
        tags: res.data.tags,
      });
      setIsLoading(false);
      return Promise.resolve(res.data);
    } catch (error) {
      setIsLoading(false);
      if (axios.isAxiosError(error) && error.response) {
        return Promise.resolve(
          `Error in fetch: ${error.response.data.message}`
        );
      } else {
        return Promise.resolve("Error in fetch: Network error or other issue");
      }
    }
  };

  const setUserLink = async (target: EventTarget) => {
    //on change
    const inputElement = target as HTMLInputElement;

    //setURL
    setPoster({ ...poster, content: inputElement.value });
    setIsContent(true);

    if (!inputElement.value.includes("https://i.imgur.com")) {
      try {
        //add to database
        const config = {
          headers: {
            "Content-Type": "application/json",
          },
        };
        const url =
          BACKEND +
          "drafts/draft/fromlink?userId=" +
          profile.id +
          "&startDate=" +
          poster.startDate!;
        const requestBody = {
          content: inputElement.value,
        };
        setIsLoading(true);
        const res = await axios.post(url, requestBody, config);
        setPosterSrc(inputElement.value);
        setDraftId(res.data.data.id);
        setCVFields(res.data.data.id);
        return Promise.resolve(res.data.data);
      } catch (error) {
        setIsLoading(false);
        if (axios.isAxiosError(error) && error.response) {
          return Promise.resolve(
            `Error in fetch: ${error.response.data.message}`
          );
        } else {
          return Promise.resolve(
            "Error in fetch: Network error or other issue"
          );
        }
      }
    }
  };

  const createImgurLink = async (file: File | string) => {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    try {
      const url = BACKEND + "drafts/draft/imgur";

      const formData = new FormData();
      formData.append("content", file);
      formData.append("userId", profile.id);
      formData.append("startDate", poster.startDate!);
      setIsLoading(true);
      const res = await axios.post(url, formData, config);
      setDraftId(res.data.data.id);
      return Promise.resolve(res.data.data);
    } catch (error) {
      setIsLoading(false);
      if (axios.isAxiosError(error) && error.response) {
        console.error(error.response.data.message);
        console.error(error);
        return Promise.resolve(
          `Error in fetch: ${error.response.data.message}`
        );
      } else {
        return Promise.resolve("Error in fetch: Network error or other issue");
      }
    }
  };

  const handlePosterUpload = async (target: EventTarget & HTMLInputElement) => {
    // console.log("called poster upload");
    if (target.files) {
      const file = target.files[0]; //getting the file object

      if (file && file.type.startsWith("image/")) {
        //convert our image file into a format that can be fed into img component's src property to be displayed after upload
        const reader = new FileReader();
        reader.onload = function (e) {
          if (e.target && typeof e.target.result === "string") {
            setPosterSrc(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      }

      const output = await createImgurLink(file);

      setCVFields(output.id);
      setIsContent(true);
      setPoster({ ...poster, content: output.content, id: output.id });
    }
  };

  const onSaveSelectTags = async () => {
    await getPoster();
    await updatePoster(poster, poster.id ? poster.id : draftId);
    setRefresh(!refresh);
    setShowTags(true);
  };

  // updates a draft with new info when a user clicks to tags or presses X
  const updatePoster = async (poster: IPosterObject, id: string) => {
    try {
      const url = BACKEND + "posters/update/" + id;
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const response = await axios.put(url, poster, config);
      return Promise.resolve(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return Promise.resolve(
          `Error in fetch: ${error.response.data.message}`
        );
      } else {
        return Promise.resolve("Error in fetch: Network error or other issue");
      }
    }
  };

  const onBack = () => {
    setShowTags(false);
  };

  const onClose = () => {
    if (poster.startDate && poster.title && (isContent || poster.content)) {
      //popup u sure u wanna del this?
      setPopModalOpen(true);
    } else {
      setModalOpen("");
    }
  };

  const onDraft = async () => {
    await updatePoster(poster, poster.id ? poster.id : draftId);
    setModalOpen("");
    setPoster({});
    setPosterSrc("");
    setRefresh(!refresh);
  };

  return (
    <>
      {popModalOpen &&
        poster.startDate &&
        poster.title &&
        (isContent || poster.content) && (
          <PopupModal
            posterId={draftId ? draftId : poster.id}
            onCloseModal={onClose}
            setPopModalOpen={setPopModalOpen}
            showDraft={true}
            updatePoster={updatePoster}
          />
        )}
      {modalOpen == "createImage" && (
        <Modal closeOnOverlayClick={false} isOpen={true} onClose={onClose}>
          <div className="modal-font">
            <ModalOverlay className="modal-overlay" />
            <ModalContent className="modal-content">
              {isLoading && (
                <div className="loading-screen">
                  <img className="loading-gif" src="/loading.gif" />
                </div>
              )}
              <ModalHeader className="modal-header">
                Upload a Poster
              </ModalHeader>
              <ModalCloseButton
                className="close-button"
                onClick={onClose}
                style={{ backgroundColor: "var(--dark-purple100)" }}
              />
              <ModalBody className="modal-body">
                <div className="create-div">
                  {posterSrc ? (
                    <Box
                      className="view-image"
                      maxHeight={"76vh"}
                      overflowY={"scroll"}
                      style={{ marginTop: 0 }}
                    >
                      <img src={posterSrc}></img>
                    </Box>
                  ) : (
                    <div className="image-container"></div>
                  )}

                  {showTags ? (
                    <TagsModal
                      onClose={onClose}
                      onBack={onBack}
                      draftId={draftId}
                      setShowTags={setShowTags}
                      updatePoster={updatePoster}
                      isDraft={isDraft}
                    />
                  ) : (
                    <div className="input-fields">
                      <div>
                        <h3>
                          Image <span style={{ color: "red" }}>*</span>
                        </h3>
                        <div className="input-text-input">
                          <Input
                            id="image-url"
                            placeholder="Enter URL - .PNG or .JPG/JPEG"
                            value={poster.content}
                            onChange={(ev) =>
                              handleChange(ev.target.value, "content")
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setUserLink(e.target);
                              }
                            }}
                            // needs to be able to take in a user link and call backend to create poster
                          ></Input>
                          <h3>or</h3>
                          <label
                            htmlFor="image-upload"
                            className="upload-button"
                          >
                            Upload
                          </label>
                          <Input
                            type="file"
                            onChange={(ev) => handlePosterUpload(ev.target)}
                            id="image-upload"
                            accept="image/png, image/jpeg, image/jpg"
                            display="none"
                          ></Input>
                        </div>
                      </div>
                      <div
                        className="instruction"
                        style={{ fontSize: "small" }}
                      >
                        Press Enter to see preview
                      </div>
                      <div className="title-div">
                        <h3>
                          Title <span style={{ color: "red" }}>*</span>
                        </h3>
                        <Input
                          placeholder="Enter Title"
                          value={poster.title}
                          onChange={(ev) =>
                            handleChange(ev.target.value, "title")
                          }
                        ></Input>
                      </div>
                      <div className="location-div">
                        <h3>Location</h3>
                        <Input
                          placeholder="Enter Location"
                          value={poster.location}
                          onChange={(ev) =>
                            handleChange(ev.target.value, "location")
                          }
                        />
                        {/* <div>
                          <h3>Repeats</h3>
                          <Select
                            placeholder="Repeats"
                            id="recur-select"
                            width="8vw"
                            color="white"
                            value={poster.isRecurring}
                            onChange={(ev) =>
                              handleChange(ev.target.value, "isRecurring")
                            }
                          >
                            <option value="NEVER">Never</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                          </Select>
                        </div> */}
                      </div>
                      <div className="date-div">
                        <h3>Date</h3>
                        <div className="input-text-input">
                          <Input
                            id="date-time-input"
                            placeholder="Select Date and Time"
                            type="datetime-local"
                            // width="15.2vw"
                            color="white"
                            value={poster.startDate}
                            onChange={(ev) =>
                              handleChange(ev.target.value, "startDate")
                            }
                          />
                          <h3>to</h3>
                          <Input
                            id="date-time-input"
                            placeholder="Select Date and Time"
                            type="datetime-local"
                            // width="15.2vw"
                            color="white"
                            value={poster.endDate}
                            onChange={(ev) =>
                              handleChange(ev.target.value, "endDate")
                            }
                          />
                        </div>
                      </div>
                      <div className="link-div">
                        <h3>Link</h3>
                        <Input
                          placeholder="Enter Link"
                          value={poster.link}
                          onChange={(ev) =>
                            handleChange(ev.target.value, "link")
                          }
                        />
                      </div>
                      <div className="desc-div">
                        <h3>Description</h3>
                        <Textarea
                          id="description-input"
                          placeholder="Enter Description"
                          wordBreak="break-word"
                          resize="none"
                          value={poster.description}
                          onChange={(ev) =>
                            handleChange(ev.target.value, "description")
                          }
                        />
                      </div>
                      <div className="save-div">
                        <Button
                          className="secondary-button"
                          style={{
                            backgroundColor: "var(--dark-purple100)",
                            marginTop: "1vh",
                          }}
                          onClick={onDraft}
                          isDisabled={isLoading || !poster.title || !posterSrc}
                        >
                          {!poster.id ? "Save Draft & Exit" : "Save & Exit"}
                        </Button>
                        <Button
                          onClick={onSaveSelectTags}
                          className="save-button"
                          style={{
                            backgroundColor: "var(--dark-purple100)",
                            marginTop: "1vh",
                          }}
                          isDisabled={isLoading || !poster.title || !posterSrc}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
            </ModalContent>
          </div>
        </Modal>
      )}
    </>
  );
}
