import { useRecoilState } from "recoil";
import {
  modalOpenState,
  posterSrcState,
  posterState,
  profileState,
  refreshState,
} from "./atoms/atoms";
import { MouseEvent, useCallback, useEffect, useState } from "react";
import "../styles/ImageCard.css";
import "../styles/Modal.css";
import axios from "axios";
import ViewPosterModal from "./ViewPosterModal";
import PopupModal from "./PopupModal";
import CreateImageModal from "./CreateImageModal";
import { BACKEND } from "../vars";

interface ProfileImageCardProps {
  title?: string;
  content: string;
  startDate: number[];
  endDate?: number[];
  location?: string;
  link?: string;
  description?: string;
  tags?: Set<string>;
  recurs: string;
  id: string;
  created: boolean;
  isDraft: boolean;
}

export const ProfileImageCard: React.FC<ProfileImageCardProps> = ({
  title,
  content,
  startDate,
  endDate,
  location,
  link,
  description,
  tags,
  recurs,
  id,
  created,
  isDraft,
}) => {
  const listMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const listWeekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const [modalOpen, setModalOpen] = useState<string>("");
  const [, setEditModal] = useRecoilState(modalOpenState);
  const handleViewPoster = useCallback(() => {
    setModalOpen("viewImage");
  }, []);
  const monthName =
    listMonths[new Date(JSON.stringify(startDate[1])).getMonth()];
  const month = monthName.substring(0, 3);
  const fullStartDate = `${monthName} ${startDate[2]}, ${startDate[0]}`;
  let fullEndDate = null;
  if (endDate) {
    fullEndDate = `${monthName} ${endDate[2]}, ${endDate[0]}`;
  }
  const weekday = listWeekdays[new Date(fullStartDate).getDay()];
  const [userId] = useRecoilState(profileState);
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const [refresh, setRefresh] = useRecoilState<boolean>(refreshState);
  const [profile, setProfile] = useRecoilState(profileState);
  const [, setPoster] = useRecoilState(posterState);
  const [, setPosterSrc] = useRecoilState(posterSrcState);
  const [popModalOpen, setPopModalOpen] = useState<boolean>(false);

  useEffect(() => {
    console.log("popup modal is: " + popModalOpen);
  }, [popModalOpen]);

  const fetchSaved = async (profile: { id: string }, posterId: string) => {
    try {
      //fetch savedposters
      const savedPosters = await fetch(
        BACKEND + "users/savedPosters/" + profile.id
      );
      //if poster in saved , set class to clicked
      if (savedPosters.ok) {
        const posterSet = await savedPosters.json();
        //if poster id passed in is among saved posts
        const clicked = posterSet.data.some(
          (poster: { id: string }) => poster.id === posterId
        );
        //handles settles isClicked to false when necessary too
        setIsClicked(clicked);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const getUserCreated = async () => {
    const createdResp = await fetch(
      BACKEND + "users/createdPosters/" + profile.id
    );
    if (createdResp.ok) {
      const created = await createdResp.json();
      //get each poster given id then set created
      const newCreatedPosters = [];
      for (const poster of created.data) {
        const postersResp = await fetch(
          BACKEND + "posters/" + poster.id
        );
        if (postersResp.ok) {
          const posterData = await postersResp.json();
          newCreatedPosters.push(posterData.data);
        }
      }
      setProfile({ ...profile, createdPosters: newCreatedPosters });
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSaved(userId, id);
    }
  }, [refresh, userId, isClicked]);

  const fetchSavedOnClose = async () => {
    if (userId) {
      await fetchSaved(userId, id);
    }
  };

  const onClickView = async () => {
    setModalOpen("");
    await fetchSavedOnClose();
    await getUserCreated();
  };

  const onClickHeart = async (event) => {
    // stops the click event from propagating to its parent
    event.stopPropagation();
    const heartIcon = document.querySelector(`.heart-icon`);
    if (heartIcon) {
      //if alredy clicked, un fill, un save
      if (isClicked) {
        //unfill
        setIsClicked(false);
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
            userId.id;
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
        //if not yet clicked, fill and save
      } else {
        //fill
        setIsClicked(true);

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
            userId.id;
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
      }
    }
  };

  // parses the date from the fetched poster object into format that can be displayed on image card
  function time(date: number[]) {
    let minutes = JSON.stringify(date[4]);
    if (date[4] === 0) {
      minutes = "00";
    }
    if (date[3] > 12) {
      return date[3] - 12 + ":" + minutes + " PM";
    } else if (date[3] === 0) {
      return "12:" + minutes + " AM";
    } else {
      return date[3] + ":" + minutes + " AM";
    }
  }

  const startTime = time(startDate);
  let endTime = null;
  if (endDate) {
    endTime = time(endDate);
  }
  const day = startDate[2];

  const onDelete = async (
    event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>
  ) => {
    //open popup modal
    event.stopPropagation();
    setPopModalOpen(true);
  };

  const onClickEdit = (e: MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    setEditModal("createImage");
    const newStartDate = [...startDate];
    newStartDate[1] -= 1;
    let newEndDate;
    if (endDate) {
      newEndDate = [...endDate];
      newEndDate[1] -= 1;
    }
    //set poster state to poster associated w the porfile image card
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
      isDraft: isDraft,
    });
    setPosterSrc(content);
  };

  return (
    <>
      {popModalOpen && (
        <PopupModal
          posterId={id}
          onCloseModal={onClickView}
          setPopModalOpen={setPopModalOpen}
          showDraft={false}
        />
      )}
      {modalOpen == "createImage" && <CreateImageModal />}
      <div className="profile-card" onClick={handleViewPoster} id={id}>
        <div className="profile-card-backing">
          <img
            src={content}
            alt={title}
            loading="lazy"
            className="poster-image"
          />
        </div>
        <div className="profile-overlay">
          <div className="profile-top-info">
            <div className="profile-month-date">
              <p id="profile-month">{month}</p>
              <p id="profile-day">{day}</p>
            </div>
            <div className="profile-weekday-time">
              <p id="profile-weekday">{weekday}</p>
              <p id="profile-time">
                {startTime}
                {endTime && "-" + endTime}
              </p>
            </div>
            {userId && (
              <>
                <div className="modal-icons">
                  {!isDraft && (
                    <div
                      className={`heart-icon ${isClicked ? "clicked" : ""}`}
                      id={id}
                      onClick={(event) => onClickHeart(event)}
                      style={{
                        width: "26px",
                        height: "26px",
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
                          width: "30px",
                          height: "30px",
                          boxSizing: "content-box",
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                        }}
                        onClick={(e) => onClickEdit(e)}
                      ></div>
                      <div
                        className="close-icon"
                        style={{
                          width: "30px",
                          height: "30px",
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
          </div>
          {title && (
            <p id="profile-title">
              {title.length > 40 ? title.slice(0, 40) + "..." : title}
            </p>
          )}
        </div>
        {modalOpen === "viewImage" && title && (
          <ViewPosterModal
            onClose={() => onClickView()}
            setClicked={setIsClicked}
            title={title}
            content={content}
            startDate={fullStartDate}
            endDate={fullEndDate!}
            startTime={startTime}
            endTime={endTime!}
            location={location!}
            link={link!}
            description={description!}
            tags={tags!}
            recurs={recurs}
            id={id}
            created={created}
            isDraft={isDraft}
          />
        )}
      </div>
    </>
  );
};
