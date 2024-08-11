import "../styles/Profile.css";
import { useRecoilState } from "recoil";
import { profileState, refreshState } from "./atoms/atoms";
import "../styles/Modal.css";
import { useEffect, useState } from "react";
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  IconButton,
  Button,
} from "@chakra-ui/react";
import Masonry from "masonry-layout";
import { IPoster } from "./Happenings";
import imagesLoaded from "imagesloaded";
import { TriangleUpIcon } from "@chakra-ui/icons";
import { classNameTag, createUser, scrollToTop } from "../functions/fetch";
import CalendarModal from "./CalendarModal";
import InterestsModal from "./InterestsModal";
import { ProfileImageCard } from "./ProfileImageCard";
import EditProfileModal from "./EditProfileModal";
import { BACKEND } from "../vars";

export default function Profile() {
  const [profile] = useRecoilState(profileState);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [createdCount, setCreatedCount] = useState<number>(0);
  const [createdPosters, setCreatedPosters] = useState<IPoster[]>([]);
  const [drafts, setDrafts] = useState<IPoster[]>([]);
  const [draftsCount, setDraftsCount] = useState<number>(0);
  const [savedPosters, setSavedPosters] = useState<IPoster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [calOpen, setCalOpen] = useState<boolean>(false);
  const [editingMode, setEditingMode] = useState<boolean>(false);
  const [interestsState, setInterestsState] = useState<boolean>(false);
  const [refresh] = useRecoilState(refreshState);

  useEffect(() => {
    // Check if profile is not null before trying to access properties
    setIsLoading(true);
    if (profile) {
      const get = async () => {
        await getUserCreated();
        await getUserLikes();
        await getUserInterests();
        await getUserDrafts();
      };
      get().then(() => setIsLoading(false));
    }
  }, [profile, refresh]);

  useEffect(() => {
    imagesLoaded(`.saved-grid`, function () {
      new Masonry(`.saved-grid`, {
        columnWidth: 34,
        itemSelector: ".profile-card",
        gutter: 11,
      });
    });
    imagesLoaded(`.created-grid`, function () {
      new Masonry(`.created-grid`, {
        columnWidth: 34,
        itemSelector: ".profile-card",
        gutter: 11,
      });
    });
    imagesLoaded(`.drafts-grid`, function () {
      new Masonry(`.drafts-grid`, {
        columnWidth: 34,
        itemSelector: ".profile-card",
        gutter: 11,
      });
    });
  }, [createdPosters, savedPosters, drafts]);

  const getUserLikes = async () => {
    const likesResp = await fetch(BACKEND + "users/savedPosters/" + profile.id);
    if (likesResp.ok) {
      const likes = await likesResp.json();
      setSavedPosters(likes.data);
      setLikeCount(likes.data.length);
      // console.log(likes.data);
    }
  };

  const getUserCreated = async () => {
    const createdResp = await fetch(
      BACKEND + "users/createdPosters/" + profile.id
    );
    if (createdResp.ok) {
      const created = await createdResp.json();
      setCreatedCount(created.data.length);
      //get each poster given id then set created
      const newCreatedPosters = [];
      for (const poster of created.data) {
        const postersResp = await fetch(BACKEND + "posters/" + poster.id);
        if (postersResp.ok) {
          const posterData = await postersResp.json();
          newCreatedPosters.push(posterData.data);
        }
      }
      // console.log(newCreatedPosters);
      setCreatedPosters(newCreatedPosters);
    }
  };

  const getUserDrafts = async () => {
    const draftsres = await fetch(BACKEND + "users/drafts/" + profile.id);
    if (draftsres.ok) {
      const drafts = await draftsres.json();
      setDraftsCount(drafts.data.length);
      //get each poster given id then set created
      const newDrafts = [];
      for (const poster of drafts.data) {
        const postersResp = await fetch(BACKEND + "drafts/" + poster.id);
        if (postersResp.ok) {
          const posterData = await postersResp.json();
          newDrafts.push(posterData.data);
        }
      }
      setDrafts(newDrafts);
      // console.log(newDrafts);
    }
  };

  const getUserInterests = async () => {
    //find user by id
    const userResp = await fetch(BACKEND + "users/" + profile.id);
    if (userResp.ok) {
      const user = await userResp.json();
      setInterests(user.data.interests);
    }
  };

  const handleTabChange = () => {
    // Explicitly trigger Masonry layout update when the tab becomes visible
    imagesLoaded(`.saved-grid`, function () {
      new Masonry(`.saved-grid`, {
        columnWidth: 34,
        itemSelector: ".profile-card",
        gutter: 11,
      });
    });
    imagesLoaded(`.created-grid`, function () {
      new Masonry(`.created-grid`, {
        columnWidth: 34,
        itemSelector: ".profile-card",
        gutter: 11,
      });
    });
    imagesLoaded(`.drafts-grid`, function () {
      new Masonry(`.drafts-grid`, {
        columnWidth: 34,
        itemSelector: ".profile-card",
        gutter: 11,
      });
    });
  };

  return (
    <>
      <main className="user-page">
        {isLoading && (
          <div className="loading-screen">
            <img className="loading-gif" src="/loading.gif" />
          </div>
        )}
        {calOpen && <CalendarModal onClose={() => setCalOpen(false)} />}
        <div className="profile">
          {editingMode && (
            <EditProfileModal
              savedPosters={savedPosters}
              createdPosters={createdPosters}
              onClose={() => setEditingMode(false)}
            />
          )}
          {profile && (
            <>
              <div className="profile-picture">
                <img
                  src={profile.picture}
                  alt=""
                  className="profile-picture"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <h1 className="name" style={{ marginTop: "1vh" }}>
                {profile.name.length > 25
                  ? profile.name.slice(0, 25) + "..."
                  : profile.name}
              </h1>
              <p>{profile.email}</p>
              <div className="icons">
                <Button
                  className="edit-button"
                  onClick={() => {
                    setEditingMode(true);
                  }}
                >
                  Edit Profile
                </Button>
                <Button
                  className="calendar-button"
                  onClick={() => setCalOpen(true)}
                >
                  <img
                    className="calendar-icon"
                    src="/calendar-day-svgrepo-com.svg"
                    alt=""
                  />
                </Button>
              </div>
              <div className="info-rows">
                <div className="field-name">Likes</div>
                <div id="field-data">{likeCount}</div>
              </div>
              <div className="info-rows">
                <div className="field-name">Created</div>
                <div id="field-data">{createdCount}</div>
              </div>
              <div className="info-rows">
                <div className="field-name">Drafts</div>
                <div id="field-data">{draftsCount}</div>
              </div>
              <div className="info-rows">
                <div className="field-name">Interests</div>
              </div>
              <div id="profile-interests">
                {Array.from(interests).map((interest, index) => (
                  <div className={classNameTag(index)} key={index}>
                    {interest}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {interestsState && (
          <InterestsModal
            createUser={createUser}
            page={false}
            onClose={() => setInterestsState(false)}
          />
        )}
        <Tabs
          variant="soft-rounded"
          className="profile-posters"
          onChange={handleTabChange}
        >
          <TabList className="tabs-list">
            <Tab
              backgroundColor={"transparent !important"}
              className="profile-tabs"
              _selected={{
                backgroundColor: "rgba(63, 49, 94, 1) !important",
                color: "white !important",
                boxShadow: "0px 1px 9px 0px rgba(63, 49, 94, 0.20)",
              }}
            >
              Liked
            </Tab>
            <Tab
              backgroundColor={"transparent !important"}
              className="profile-tabs"
              _selected={{
                backgroundColor: "rgba(63, 49, 94, 1) !important",
                color: "white !important",
                boxShadow: "0px 1px 9px 0px rgba(63, 49, 94, 0.20)",
              }}
            >
              Created
            </Tab>
            <Tab
              backgroundColor={"transparent !important"}
              className="profile-tabs"
              _selected={{
                backgroundColor: "rgba(63, 49, 94, 1) !important",
                color: "white !important",
                boxShadow: "0px 1px 9px 0px rgba(63, 49, 94, 0.20)",
              }}
            >
              Drafts
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className="saved-grid">
                {savedPosters.map((poster, index) => (
                  <Box key={index}>
                    <ProfileImageCard
                      title={poster.title!}
                      content={poster.content!}
                      startDate={poster.startDate!}
                      endDate={poster.endDate!}
                      location={poster.location}
                      link={poster.link}
                      description={poster.description}
                      tags={poster.tags}
                      recurs={poster.isRecurring!}
                      id={poster.id}
                      created={false}
                      isDraft={false}
                    />
                  </Box>
                ))}
              </div>
            </TabPanel>
            <TabPanel>
              <div className="created-grid">
                {createdPosters.map((poster, index) => (
                  <Box key={index}>
                    <ProfileImageCard
                      title={poster.title!}
                      content={poster.content!}
                      startDate={poster.startDate!}
                      endDate={poster.endDate!}
                      location={poster.location}
                      link={poster.link}
                      description={poster.description}
                      tags={poster.tags}
                      recurs={poster.isRecurring!}
                      id={poster.id}
                      created={true}
                      isDraft={false}
                    />
                  </Box>
                ))}
              </div>
            </TabPanel>
            <TabPanel>
              <div className="drafts-grid">
                {drafts.map((poster, index) => (
                  <Box key={index}>
                    <ProfileImageCard
                      title={poster.title ? poster.title : "No Title"}
                      content={poster.content!}
                      startDate={poster.startDate!}
                      endDate={poster.endDate!}
                      location={poster.location}
                      link={poster.link}
                      description={poster.description}
                      tags={poster.tags}
                      recurs={poster.isRecurring!}
                      id={poster.id}
                      created={true}
                      isDraft={true}
                    />
                  </Box>
                ))}
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </main>
      <IconButton
        className="scroll-top"
        color="white"
        backgroundColor="var(--dark-purple100)"
        icon={<TriangleUpIcon id="triangle-icon-up" />}
        aria-label={"scrolls user to bottom of page"}
        onClick={scrollToTop}
      />
    </>
  );
}
