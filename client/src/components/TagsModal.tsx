import { Button } from "@chakra-ui/react";
import "../styles/Modal.css";
import { useEffect, useState } from "react";
import axios from "axios";

export default function TagsModal({
  onClose,
  onBack,
  poster,
  posterId,
  handleChange,
}) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tags, setTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchTags() {
      try {
        const response = await fetch("http://localhost:8080/posters/alltags");
        if (response.ok) {
          const tagsData = await response.json();
          setAllTags(tagsData);
        } else {
          throw new Error("Failed to fetch tags");
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    }
    fetchTags();
  }, []);

  const classNameTag = (index: number) => {
    if (index % 3 == 0) {
      return "magenta-tag";
    } else if (index % 3 == 1) {
      return "green-tag";
    } else {
      return "blue-tag";
    }
  };

  //onclick
  const onClick = (tag: string) => {
    //if in tagslist, take out
    const updatedTags = new Set(tags); // Create a new set from the current tags

    if (updatedTags.has(tag)) {
      updatedTags.delete(tag); // If the tag exists, remove it from the set
    } else {
      console.log(JSON.stringify(Array.from(updatedTags)) + " inside tags");
      updatedTags.add(tag); // If the tag doesn't exist, add it to the set
    }

    setTags(updatedTags);
  };

  //on hit create button
  const createPoster = async () => {
    //add list to poster obj w handlechange
    // console.log(JSON.stringify(poster) + " before tags");
    const newPoster = handleChange(
      tags,
      "tags"
      // console.log(JSON.stringify(poster) + " after updating tags");
    );
    // console.log(JSON.stringify(Array.from(tags)) + " tags");
    // console.log(JSON.stringify(newPoster) + " after tags");
    //call put endpoint
    try {
      //add to database
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const url = "http://localhost:8080/posters/update/" + posterId;
      const formData = new FormData();
      for (const key in newPoster) {
        if (newPoster[key]) {
          formData.append(key, newPoster[key]);
        }
      }
      // formData.append("tags", JSON.stringify(Array.from(tags)));
      console.log(JSON.stringify(Array.from(formData)) + " formdata");
      const res = await axios.put(url, formData, config);
      onClose();
      return Promise.resolve(res.data.data);
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

  return (
    <>
      <div className="tags-container">
        <div className="tags-div">
          {allTags.map((tag, index) => {
            return (
              <div
                key={tag}
                className={classNameTag(index)}
                onClick={() => onClick(tag)}
              >
                {tag}
              </div>
            );
          })}
        </div>
        <div className="final-save-div">
          <Button onClick={onBack} className={"final-upload-button"}>
            Back
          </Button>
          <Button className="final-upload-button" onClick={createPoster}>
            Upload Poster
          </Button>
        </div>
      </div>
    </>
  );
}
