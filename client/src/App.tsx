import { useCallback, useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Home from "./components/Home";
import Happenings from "./components/Happenings";
import Archive from "./components/Archive";
import About from "./components/About";
import "./styles/App.css";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import CreateImageModal from "./components/CreateImageModal";
import {
  CredentialResponse,
  googleLogout,
  useGoogleLogin,
} from "@react-oauth/google";
import axios from "axios";
import { createUser } from "./functions/fetch";
import Profile from "./components/Profile";
import { modalOpenState, profileState } from "./components/atoms/atoms";
import { useRecoilState } from "recoil";
import InterestsModal from "./components/InterestsModal";
import { BACKEND } from "./vars";

export default function App() {
  const [modalOpen, setModalOpen] = useRecoilState<string>(modalOpenState);
  const [user, setUser] = useState<CredentialResponse>();
  const [profile, setProfile] = useRecoilState(profileState);
  const [interestsState, setInterestsState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hamburgerOpen, setHamburgerOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
    onError: (error) => console.log("Login Failed:", error),
  });

  const findUser = async (id: string) => {
    if (id) {
      //if user id exists
      const foundUser = await fetch(BACKEND + "users/" + id);

      if (foundUser.ok) {
        const userValid = await foundUser.json();

        if (userValid.message === "User found") {
          //user already exists
          setProfile(userValid.data); // database info
          localStorage.setItem("userProfile", JSON.stringify(userValid.data)); //user id
          setInterestsState(false);

          return true;
        }
        return false;
      } else {
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const userInfoResponse = await axios.get(
            `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`,
            {
              headers: {
                Authorization: `Bearer ${user.access_token}`,
                Accept: "application/json",
              },
            }
          );

          const userInfo = userInfoResponse.data; //google response

          if (userInfo.hd == "brown.edu" || userInfo.hd == "risd.edu") {
            //check for valid brown / risd
            localStorage.setItem(
              "userProfileInitial",
              JSON.stringify(userInfo)
            );
            setIsLoading(true);
            //check if user exists in the database with get user by id
            const userID = userInfo.id;
            // console.log("user id is: " + userID);
            const found = await findUser(userID); //does the user exist?
            // console.log("is user found: " + found);
            if (!found) {
              //new user
              localStorage.setItem(
                "userProfile",
                localStorage.getItem("userProfileInitial")!
              );
              setProfile(userInfo); //set prof to google state
              // console.log("profile set to user info");
              // console.log(userInfo);
              setIsLoading(false);
              setInterestsState(true); //open interests modal
            }
          } else {
            //not a valid email
            window.alert("Please use a valid Brown or RISD email");
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    const onMount = async () => {
      if (!localStorage.getItem("userProfile")) {
        //if no local storage - logged out or first time
        // console.log("logged out");
        fetchData();
      } else {
        //existing local profile
        //console.log("logged in");
        const userProfileString = localStorage.getItem("userProfile");
        const userProfile = JSON.parse(userProfileString!);
        const userId = userProfile.id;
        //console.log(userId);
        if (userId) {
          await findUser(userId);
        }
      }
    };
    onMount();
  }, [user, setProfile]);

  useEffect(() => {
    setIsLoading(false);
  }, [profile]);

  // log out function to log the user out of google and set the profile array to null
  const logOut = () => {
    googleLogout();
    setProfile(null);
    localStorage.removeItem("userProfile");
    localStorage.removeItem("userProfileInitial");
    navigate("/home");
  };

  const handleCreatePoster = useCallback(() => {
    // Toggle the state to open/close the modal
    setModalOpen("createImage");
  }, []);

  return (
    <>
      <article>
        {isLoading && (
          <div className="loading-screen">
            <img className="loading-gif" src="/loading.gif" />
          </div>
        )}
        <header>
          <nav>
            <div className="left-links">
              <NavLink to="/home" id="logo">
                P@B
              </NavLink>
              <NavLink to="/happenings" className="nav-link">
                Happenings
              </NavLink>
              <NavLink to="/archive" className="nav-link">
                Archive
              </NavLink>
              <NavLink to="/about" className="nav-link">
                About
              </NavLink>
            </div>
            <div className="right-links">
              {profile ? (
                <>
                  <Button
                    id="create"
                    onClick={handleCreatePoster}
                    backgroundColor={"var(--dark-purple100)"}
                  >
                    +
                  </Button>
                  <div id="profile">
                    <NavLink to="/profile" className="profile-link">
                      {profile.name.length > 25
                        ? profile.name.slice(0, 25) + "..."
                        : profile.name}
                    </NavLink>
                  </div>
                  <Button id="logout" onClick={logOut} color={"white"}>
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <div className="g-signin2" data-onsuccess="onSignIn">
                    <Button
                      id="login"
                      onClick={() => login()}
                      style={{ backgroundColor: "var(--dark-purple100)" }}
                    >
                      Login
                    </Button>
                  </div>
                </>
              )}
            </div>

            <NavLink to="/home" id="logo" className="invis">
              P@B
            </NavLink>
            <div className="hamburger-menu-outer">
              <Button
                id="create"
                onClick={handleCreatePoster}
                backgroundColor={"var(--dark-purple100)"}
              >
                +{" "}
              </Button>
              <div></div>
              <div
                className="hamburger-menu"
                onMouseEnter={() => setHamburgerOpen(true)}
              >
                <div className="hamburger-icon">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                {hamburgerOpen && (
                  <>
                    <div
                      className="dropdown"
                      onMouseLeave={() => setHamburgerOpen(false)}
                    >
                      <NavLink to="/happenings" className="nav-link">
                        Happenings
                      </NavLink>
                      <NavLink to="/archive" className="nav-link">
                        Archive
                      </NavLink>
                      <NavLink to="/about" className="nav-link">
                        About
                      </NavLink>
                      {profile ? (
                        <>
                          <div id="profile">
                            <NavLink to="/profile" className="profile-link">
                              {profile.name}
                            </NavLink>
                          </div>
                          <Button id="logout" onClick={logOut} color={"white"}>
                            Log Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="g-signin2" data-onsuccess="onSignIn">
                            <Button
                              id="login"
                              onClick={() => login()}
                              style={{
                                backgroundColor: "var(--dark-purple100)",
                              }}
                            >
                              Login
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </nav>
        </header>
        <main style={{ height: "fit-content" }}>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/" element={<Home />} />
            <Route path="/happenings" element={<Happenings />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          {modalOpen && <CreateImageModal />}
        </main>
        <footer className="footer">
          <div className="foot-left">
            Made with love by the Posters @ Brown team
          </div>
          <div className="foot-right">
            <a href="https://forms.gle/iNRs9GNxhDiGgfE5A" target="_blank">
              Feedback
            </a>
          </div>
        </footer>
      </article>
      {interestsState && (
        <Modal isOpen={true} onClose={() => setInterestsState(false)}>
          <div className="modal-font">
            <ModalOverlay />
            <ModalContent>
              <ModalCloseButton
                className="close-button"
                onClick={() => setInterestsState(false)}
              />
              <ModalHeader className="modal-header">
                Select Up to 5 Interests
              </ModalHeader>
              <ModalBody>
                <InterestsModal
                  createUser={createUser}
                  page={false}
                  onClose={() => setInterestsState(false)}
                />
              </ModalBody>
            </ModalContent>
          </div>
        </Modal>
      )}
    </>
  );
}
