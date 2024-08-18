import {
  Box,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";
import "../styles/Modal.css";
import { MouseEvent, useEffect, useState } from "react";
import axios from "axios";
import { useRecoilState } from "recoil";
import {
  modalOpenState,
  posterSrcState,
  posterState,
  profileState,
  refreshState,
} from "./atoms/atoms";
import { classNameTag } from "../functions/fetch";
import PopupModal from "./PopupModal";
import { BACKEND } from "../vars";

interface viewProps {
  onClose: () => void;
  setClicked: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  content: string;
  startDate: number[];
  endDate?: number[];
  startTime: string;
  endTime: string;
  location: string;
  link: string;
  description: string;
  tags: Set<string>;
  recurs: string;
  id: string;
  created: boolean;
  isDraft: boolean;
}

export default function ViewPosterModal({
  onClose,
  setClicked,
  title,
  content,
  startDate,
  endDate,
  startTime,
  endTime,
  location,
  link,
  description,
  tags,
  recurs,
  id,
  created,
  isDraft,
}: viewProps) {
  const [name, setName] = useState<string>("");
  const [picture, setPicture] = useState<string>("");
  const [profile] = useRecoilState(profileState);
  const [refresh, setRefresh] = useRecoilState(refreshState);
  const [, setEditModal] = useRecoilState(modalOpenState);
  const [, setPoster] = useRecoilState(posterState);
  const [, setPosterSrc] = useRecoilState(posterSrcState);
  const [popModalOpen, setPopModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // console.log("popup modal is: " + popModalOpen);
  }, [popModalOpen]);

  useEffect(() => {
    if (profile) {
      getUser();
      const fetchSaved = async () => {
        try {
          //fetch savedposters
          const savedPosters = await fetch(
            BACKEND + "users/savedPosters/" + profile.id
          );
          //if poster in saved , set class to clicked
          if (savedPosters.ok) {
            const posterSet = await savedPosters.json();
            //compare id passed in to each poster in set
            posterSet.data.forEach((poster: { id: string }) => {
              if (poster.id === id) {
                document
                  .querySelector(".view-heart-icon")!
                  .classList.add("clicked");
              }
            });
          }
        } catch (error) {
          console.error(error);
        }
      };
      fetchSaved();
    }
  }, []);

  const getUser = async () => {
    //use poster id to get user id
    try {
      let posterRes;
      if (isDraft) {
        posterRes = await fetch(BACKEND + "drafts/" + id);
      } else {
        posterRes = await fetch(BACKEND + "posters/" + id);
      }
      if (posterRes.ok) {
        const poster = await posterRes.json();
        // console.log(poster);
        if (poster.data.userId) {
          const userRes = await fetch(
            BACKEND + "users/" + poster.data.userId
          );
          if (userRes.ok) {
            const user = await userRes.json();

            setName(user.data.name);
            setPicture(user.data.picture);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onClick = async () => {
    const heartIcon = document.querySelector(".view-heart-icon");
    if (heartIcon) {
      if (heartIcon.classList.contains("clicked")) {
        //if alredy clicked, un fill, un save
        //unfill
        heartIcon.classList.remove("clicked");
        setClicked(false);
        //unsave
        try {
          //add to database
          const config = {
            headers: {
              "Content-Type": "application/json",
            },
          };
          const url =
            BACKEND + "users/unsavePoster?posterId=" +
            id +
            "&userId=" +
            profile.id;

          const res = await axios.put(url, null, config);
          setRefresh(!refresh);
          return Promise.resolve(res.data.data);
        } catch (error) {
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
      } else {
        //if not yet clicked, fill and save
        //fill
        heartIcon.classList.add("clicked");
        //save
        try {
          //add to database
          const config = {
            headers: {
              "Content-Type": "application/json",
            },
          };
          const url =
            BACKEND + "users/savePoster?posterId=" +
            id +
            "&userId=" +
            profile.id;

          const res = await axios.put(url, null, config);
          // console.log(res.data.data);
          return Promise.resolve(res.data.data);
        } catch (error) {
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
    }
  };

  const onDelete = async (
    event: MouseEvent<HTMLDivElement, MouseEvent<Element, MouseEvent>>
  ) => {
    //open popup modal
    event.stopPropagation();
    setPopModalOpen(true);
  };

  const onClickEdit = (
    e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>
  ) => {
    e.stopPropagation();
    setEditModal("createImage");
    const newStartDate = [...startDate];
    newStartDate[1] -= 1;
    let newEndDate;
    if (endDate) {
      newEndDate = [...endDate];
      newEndDate[1] -= 1;
    }
    setPoster({
      title: title,
      content: content,
      startDate: JSON.stringify(
        new Date(
          newStartDate[0],
          newStartDate[1],
          newStartDate[2],
          newStartDate[3],
          newStartDate[4]
        )
      ),
      endDate: newEndDate
        ? JSON.stringify(
            new Date(
              newEndDate[0],
              newEndDate[1],
              newEndDate[2],
              newEndDate[3],
              newEndDate[4]
            )
          )
        : " ",
      location: location,
      link: link,
      description: description,
      tags: tags,
      isRecurring: recurs,
      id: id,
    });
    setPosterSrc(content);
    //set poster state to poster associated w the porfile image card
  };

  return (
    <>
      {popModalOpen && (
        <PopupModal
          posterId={id}
          onCloseModal={onClose}
          setPopModalOpen={setPopModalOpen}
          showDraft={false}
        />
      )}
      <Modal isOpen={true} onClose={() => onClose}>
        <div className="modal-font">
          <ModalOverlay className="modal-overlay" />
          <ModalContent
            display={"flex"}
            flexFlow={"column"}
            alignContent={"center"}
            justifyContent={"space-around"}
            minH="60%"
            className="modal-content"
          >
            <ModalCloseButton className="close-button" onClick={onClose} />
            <ModalBody className="modal-body" flexDirection={"row"}>
              <Box className="view-image" overflowY={"scroll"} id={id}>
                <img src={content} />
                {profile && (
                  <>
                    <div className="view-modal-icons">
                      {!isDraft && (
                        <div
                          className="view-heart-icon"
                          onClick={onClick}
                          style={{
                            width: "2.5vw",
                            height: "2.5vw",
                            boxSizing: "content-box",
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                          }}
                        ></div>
                      )}
                      {created && (
                        <>
                          <div
                            className="edit-icon"
                            style={{
                              width: "2.5vw",
                              height: "2.5vw",
                              boxSizing: "content-box",
                              backgroundSize: "contain",
                              backgroundRepeat: "no-repeat",
                            }}
                            onClick={(e) => onClickEdit(e)}
                          ></div>
                          <div
                            className="close-icon"
                            style={{
                              width: "2.5vw",
                              height: "2.5vw",
                              boxSizing: "content-box",
                              backgroundSize: "contain",
                              backgroundRepeat: "no-repeat",
                            }}
                            onClick={(e) => onDelete(e)}
                          ></div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </Box>
              <div className="view-info">
                <p id="view-title">{title}</p>

                <div className="poster-details">
                  {picture && name && (
                    <div
                      className="info-row"
                      style={{
                        marginBottom: "2%",
                      }}
                    >
                      {picture && (
                        <img
                          className="field-name"
                          style={{
                            width: "8%",
                            marginRight: "3%",
                          }}
                          src={picture}
                        />
                      )}
                      {name && (
                        <div id="field-text" style={{ paddingTop: "1%" }}>
                          {name}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="info-row">
                    <div className="field-name">When</div>
                    <div id="field-text">
                      {startDate + ", " + startTime}
                      {endDate &&
                        (endDate !== startDate
                          ? "-" + endDate + ", " + endTime
                          : endTime && "-" + endTime)}
                    </div>
                  </div>
                  {recurs && (
                    <div className="info-row">
                      <div className="field-name">Recurs</div>
                      <div id="field-text">{recurs.toLowerCase()}</div>
                    </div>
                  )}

                  {location && (
                    <div className="info-row">
                      <div className="field-name">Where</div>
                      <div id="field-text">{location}</div>
                    </div>
                  )}
                  {link && (
                    <div className="info-row">
                      <div className="field-name">Link</div>
                      <div id="field-text">
                        <a
                          href={
                            link.includes("http") ? link : "https://" + link
                          }
                          id="poster-link"
                          target="_blank"
                        >
                          {link}
                        </a>
                      </div>
                    </div>
                  )}
                  {Array.from(tags).length > 0 && (
                    <div className="info-row">
                      <div className="field-name">Tags</div>
                      <div id="field-tags">
                        {Array.from(tags).map((tag, index) => {
                          return (
                            <div key={tag} className={classNameTag(index)}>
                              {tag}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div id="description">
                  {description && <p id="description-field">Description</p>}
                  {description && (
                    <div id="description-text">{description}</div>
                  )}
                </div>
              </div>
            </ModalBody>
          </ModalContent>
        </div>
      </Modal>
    </>
  );
}
