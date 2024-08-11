import {
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import "../styles/Modal.css";
import { useRecoilState } from "recoil";
import { profileState } from "./atoms/atoms";
import axios from "axios";
import { useEffect, useState } from "react";
import InterestsModal from "./InterestsModal";
import { IUser, createUser } from "../functions/fetch";
import { BACKEND } from "../vars";

export default function EditProfileModal({
  savedPosters,
  createdPosters,
  onClose,
}) {
  const [profile, setProfile] = useRecoilState(profileState);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //takes in a file and returns an imgur link
  const createImgurLink = async (file: File | string) => {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    setIsLoading(true);
    try {
      const url = BACKEND + "posters/uploadToImgur";

      const formData = new FormData();
      console.log(file);
      formData.append("content", file);
      const res = await axios.post(url, formData, config);
      setIsLoading(false);
      return Promise.resolve(res.data.data);
    } catch (error) {
      setIsLoading(false);
      if (axios.isAxiosError(error) && error.response) {
        console.log(error.response.data.message);
        console.log(error);
        return Promise.resolve(
          `Error in fetch: ${error.response.data.message}`
        );
      } else {
        return Promise.resolve("Error in fetch: Network error or other issue");
      }
    }
  };

  const handleProfilePictureUpload = async (
    target: EventTarget & HTMLInputElement
  ) => {
    if (target.files) {
      const file = target.files[0]; //getting the file object
      const output = await createImgurLink(file);
      setProfile({ ...profile, picture: output });
      console.log(profile);
    }
  };

  const updateValue = (property: keyof IUser, value: string | Set<string>) => {
    setProfile((prevProfile: any) => {
      if (typeof value === "string") {
        return { ...prevProfile, [property]: value };
      } else if (value instanceof Set) {
        return { [property]: Array.from(value) };
      }
      return prevProfile;
    });
  };

  useEffect(() => {
    console.log(profile);
  }, [profile]);

  return (
    <Modal closeOnOverlayClick={false} isOpen={true} onClose={onClose}>
      <div className="modal-font">
        <ModalOverlay className="modal-overlay" />
        <ModalContent className="modal-content" style={{ maxHeight: "90%" }}>
          {isLoading && (
            <div className="loading-screen">
              <img className="loading-gif" src="/loading.gif" />
            </div>
          )}
          <ModalHeader className="modal-header">Edit Profile</ModalHeader>
          <ModalBody className="modal-body">
            <div className="create-div">
              <div className="pfp-pic-div">
                <label htmlFor="profile-upload" className="upload-pfp">
                  Upload <p>Avatar</p>
                </label>
                <Input
                  type="file"
                  onChange={(ev) => handleProfilePictureUpload(ev.target)}
                  id="profile-upload"
                  accept="image/png, image/jpeg, image/jpg"
                  display="none"
                />
                <img src={profile.picture} alt="" className="profile-pic" />
              </div>
              <div className="pfp-info-div">
                <div className="name-div">
                  <h3>Name</h3>
                  <Input
                    placeholder={profile.name}
                    value={profile.name}
                    onChange={(ev) => updateValue("name", ev.target.value)}
                  />
                </div>
                <div className="select-interests-div">
                  <h3>Select Up to 5 Interests</h3>
                  <InterestsModal
                    savedPosters={savedPosters}
                    createdPosters={createdPosters}
                    createUser={createUser}
                    page={true}
                    onClose={onClose}
                  />
                </div>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </div>
    </Modal>
  );
}
