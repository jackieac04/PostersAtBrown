import { useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalCloseButton,
} from "@chakra-ui/react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useRecoilState } from "recoil";
import { profileState } from "./atoms/atoms";
import { IPoster } from "./Happenings";
import { BACKEND } from "../vars";

export default function CalendarModal({ onClose }) {
  const [savedPosters, setSavedPosters] = useState<IPoster[]>([]);
  const [createdPosters, setCreatedPosters] = useState<IPoster[]>([]);
  const [profile] = useRecoilState(profileState);
  const [isReady, setIsReady] = useState(false);
  const [events, setEvents] = useState<
    { title: string; start: number[]; end: number[] }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsReady(false);
    setIsLoading(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      makeEvents([...savedPosters, ...createdPosters]);
      setIsLoading(false);
    }
  }, [isReady]);

  const fetchData = async () => {
    await getUserLikes();
    await getUserCreated();
    setIsReady(true);
  };

  const getUserLikes = async () => {
    try {
      const likesResp = await fetch(
        BACKEND + "users/savedPosters/" + profile.id
      );
      if (likesResp.ok) {
        const likes = await likesResp.json();
        setSavedPosters(likes.data);
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
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
      setCreatedPosters(newCreatedPosters);
    }
  };

  const makeEvents = (posters: any[]) => {
    const newEvents = posters.map((poster) => {
      const newStartDate = [...poster.startDate];
      newStartDate[1] -= 1;

      const newEndDate = poster.endDate
        ? [...poster.endDate]
        : [...poster.startDate];
      newEndDate[1] -= 1;

      return {
        title: poster.title!,
        start: newStartDate,
        end: newEndDate,
      };
    });
    setEvents(newEvents);
  };

  const handleEventClick = (info) => {
    const startDate = info.event.start;

    // Assuming you want to navigate to the dayGrid view for the clicked event
    if (startDate) {
      // const formattedStartDate = startDate.toISOString(); // You might need to format it based on your API's requirements
      info.view.calendar.gotoDate(startDate);
      info.view.calendar.changeView("timeGridDay");
    }
  };
  return isLoading ? (
    <div className="loading-screen">
      <img className="loading-gif" src="/loading.gif" />
    </div>
  ) : (
    <Modal isOpen={true} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxWidth={"fit-content"}>
        <ModalCloseButton
          className="close-button"
          onClick={onClose}
          style={{ backgroundColor: "var(--dark-purple100)" }}
        />
        <ModalBody width={"fit-content"}>
          {isReady && (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventBackgroundColor="var(--dark-purple100)"
              eventClick={(info) => handleEventClick(info)}
              views={{
                timeGrid: { buttonText: "Week" },
                dayGrid: { buttonText: "Month" },
                timeGridDay: { buttonText: "Day" },
              }}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "timeGridDay,timeGridWeek,dayGridMonth",
              }}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
