import { Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { IUser, classNameTag, fetchTags } from "../functions/fetch";
import { profileState } from "./atoms/atoms";
import { useRecoilState } from "recoil";
import "../styles/Modal.css";
import axios from "axios";
import { BACKEND } from "../vars";

export default function InterestsModal({
  savedPosters = [],
  createdPosters = [],
  createUser,
  page,
  onClose,
}) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useRecoilState(profileState);
  const [refresh] = useState<boolean>(false);
  const [localProfile, setLocalProfile] = useState<any>({});

  useEffect(() => {
    if (page) {
      setLocalProfile(profile);
      selectExistingInterests(profile.interests);
    }
  }, []);

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
    if (profile.interests) {
      setTags(new Set(profile.interests));
    }
  }, []);

  function selectExistingInterests(currInterests: Set<string>) {
    //using functional form of setTags so that all existing user interests are actually selected upon mounting
    setTags((prevInterests) => {
      const updatedInterests = new Set(prevInterests); // create a new set from the previous interests

      for (const i of currInterests) {
        updatedInterests.add(i); // add each tag from currInterests to the updated set
      }

      return updatedInterests;
    });
  }

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

      return updatedTags; // Return the updated set
    });
  };

  const addToProfile = async () => {
    //get tags
    const interests = Array.from(tags);
    // Append interests to the profile object
    const updatedProfile = {
      ...profile,
      interests: interests,
    };
    const userProfile = localStorage.getItem("userProfile");
    if (userProfile) {
      // Set the user profile in state
      setProfile(updatedProfile);
      localStorage.setItem("userProfile", updatedProfile.id);
      // console.log(profile);
      //setRefresh(!refresh);
    }
    //if on home page = false
    if (!page) {
      return await createUser(updatedProfile, onClose);
    }
    onClose();
  };

  async function updateProfile(): Promise<void> {
    const interests = Array.from(tags);

    //update profile in database put req
    try {
      const updatedUser: IUser = {
        ...profile,
        interests: interests,
        createdPosters: createdPosters,
        savedPosters: savedPosters,
      };

      //add to database
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      };
      const url = BACKEND + "users/update/" + profile.id;

      const res = await axios.put(url, updatedUser, config);

      // Set the user profile in state
      setProfile(updatedUser);
      setLocalProfile({});
      localStorage.setItem("userProfile", JSON.stringify(updatedUser));
      onClose();
      return Promise.resolve(res.data.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          Promise.resolve(`Error in fetch: ${error.response.data.message}`)
        );
      } else {
        console.error(
          Promise.resolve("Error in fetch: Network error or other issue")
        );
      }
    }
  }

  return (
    <>
      {page ? (
        <>
          <div className="interests-div">
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
          <div className="final-save-div">
            <Button
              className="final-upload-button"
              onClick={() => {
                onClose();
                setProfile(localProfile);
                setLocalProfile({});
              }}
            >
              Cancel
            </Button>
            <Button
              className="final-upload-button"
              onClick={updateProfile}
              isDisabled={
                !profile.name ||
                profile.name.length > 30 ||
                tags.size < 1 ||
                tags.size > 5
              }
            >
              Save Changes
            </Button>
          </div>
        </>
      ) : (
        <div className="tags-container" style={{ width: "100%" }}>
          <div className="tags-div">
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
          <div className="final-save-div" style={{ margin: "1vw 0vw 1vw" }}>
            <Button
              className="final-upload-button"
              onClick={addToProfile}
              style={{
                margin: "0vw 8vw 1vw",
                backgroundColor: "var(--dark-purple100)",
              }}
              isDisabled={tags.size < 1 || tags.size > 5}
            >
              Select Interests
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
