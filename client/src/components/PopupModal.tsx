import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  modalOpenState,
  posterSrcState,
  posterState,
  profileState,
  refreshState,
} from "./atoms/atoms";
import axios from "axios";
import { Dispatch, SetStateAction, useEffect } from "react";
import { BACKEND } from "../vars";

interface popupProps {
  posterId: string;
  setPopModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function PopupModal({ posterId, setPopModalOpen }: popupProps) {
  const profile = useRecoilValue(profileState);
  const setPoster = useSetRecoilState(posterState);
  const [, setModalOpen] = useRecoilState<string>(modalOpenState);
  const [, setPosterSrc] = useRecoilState(posterSrcState);
  const [refresh, setRefresh] = useRecoilState(refreshState);

  // const getPoster = async () => {
  //   try {
  //     const url = BACKEND + "posters/" + posterId;
  //     const res = await fetch(url);
  //     console.log(res);
  //     if (res.ok) {
  //       const posterData = await res.json();
  //       if (posterData.message != "Poster not found") {
  //         return "poster";
  //       } else {
  //         try {
  //           const url = BACKEND + "drafts/" + posterId;
  //           const res = await fetch(url);
  //           console.log(res);
  //           if (res.ok) {
  //             const posterData = await res.json();
  //             if (posterData.message != "Poster not found") {
  //               return "draft";
  //             }
  //           }
  //         } catch (error) {
  //           return JSON.stringify(error);
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     return JSON.stringify(error);
  //   }
  // };

  //user wants to delete draft
  const onDelete = async () => {
    // console.log("yes");
    //if poster state has ID
    if (posterId != null && posterId != "" && posterId != " ") {
      //yes? delete from database(posterID, userID)
      // const isPoster = await getPoster();
      // if (isPoster == "poster") {
      try {
        //add to database
        const config = {
          headers: {
            "Content-Type": "application/json",
          },
        };
        const url =
          BACKEND + "posters/delete/" + posterId + "?userId=" + profile.id;

        const res = await axios.delete(url, config);

        setModalOpen("");
        setPoster({});
        setPosterSrc("");
        setPopModalOpen(false);
        setRefresh(!refresh);

        //need to give enough time for the poster to be created + id to exist
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
      // }
      // else if (isPoster == "draft") {
      //   try {
      //     //delete from database
      //     const config = {
      //       headers: {
      //         "Content-Type": "application/json",
      //       },
      //     };
      //     const url = BACKEND + "drafts/delete/" + posterId;

      //     const res = await axios.delete(url, config);

      //     //sets global state to nothing (no more draft)
      //     setPoster({});
      //     setPosterSrc("");

      //     //goes to whatever page user was on (no more modal)
      //     setPopModalOpen(false);
      //     onCloseModal();

      //     //need to give enough time for the poster to be created + id to exist
      //     return Promise.resolve(res.data.data);
      // } catch (error) {
      //   if (axios.isAxiosError(error) && error.response) {
      //     return Promise.resolve(
      //       `Error in fetch: ${error.response.data.message}`
      //     );
      //   } else {
      //     return Promise.resolve(
      //       "Error in fetch: Network error or other issue"
      //     );
      //   }
      // }
      // }
    }
  };

  // //user wants to save as draft
  // //updatePoster has already been called at this point, so close popup, close create, clear fields
  // const onDraft = async () => {
  //   // setModalOpen("");
  //   // setPoster({});
  //   // setPosterSrc("");
  //   // setRefresh(!refresh);
  //   await editPoster();
  // };

  //user does not want to delete draft
  const onCancel = () => {
    setPopModalOpen(false);
  };

  return (
    <Modal isOpen={true} onClose={() => false}>
      <ModalOverlay className="modal-overlay" />
      <ModalContent className="pop-modal-content">
        <ModalHeader className="pop-modal-header">
          Are you sure you want to delete this poster?
        </ModalHeader>
        <ModalBody className="pop-modal-body">
          <div className="pop-buttons">
            <Button onClick={() => onDelete()} className="pop-button">
              Delete
            </Button>
            {/* {showDraft && (
              <Button onClick={() => onDraft()} className="pop-button">
                Save Draft
              </Button>
            )} */}
            <Button onClick={() => onCancel()} className="pop-button">
              Cancel
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
