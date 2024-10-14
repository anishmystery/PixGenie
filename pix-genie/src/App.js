import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Download from "@mui/icons-material/Download";
import Close from "@mui/icons-material/Close";
import { useState } from "react";
import axios from "axios";
import logo from "./assets/magic-lamp.png";

const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

function App() {
  return (
    <Box sx={{ padding: "16px" }}>
      <Header />
      <GenerateImagesFromKeywords />
    </Box>
  );
}

function Header() {
  return (
    <Box sx={{ marginTop: "32px", textAlign: "center" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          alignContent: "space-evenly",
        }}
      >
        <img src={logo} alt="logo" height="80px"></img>
        <Typography
          variant="h2"
          style={{ fontFamily: "Bellota", fontWeight: 400, color: "#7012DA" }}
          gutterBottom
        >
          pixgenie
        </Typography>
      </Box>
      <Typography variant="h6" gutterBottom sx={{ color: "#333A42" }}>
        Generate stunning, unique, and free images for your blog posts within
        seconds.
      </Typography>
    </Box>
  );
}

function GenerateImagesFromKeywords() {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  function handleChangeContent(e) {
    setContent(e.target.value);
  }

  function handleDialogOpen(image) {
    setSelectedImage(image);
    setIsOpen(true);
  }

  function handleDialogClose() {
    setSelectedImage();
    setIsOpen(false);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!content) setValidationMessage("Blog content is required");
    setLoading(true);
    setError("");
    setValidationMessage("");

    try {
      const response = await axios.post(
        "https://pixgenie.onrender.com/api/generate",
        {
          content: content,
        }
      );
      const keywordsResponse = JSON.parse(response.data.keywords);
      const keywords = keywordsResponse.keywords;
      const imageList = [];
      for (const keyword of keywords) {
        const unsplash_response = await axios.get(
          "https://api.unsplash.com/search/photos",
          {
            params: {
              query: keyword,
            },
            headers: {
              Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
          }
        );
        const responseImages = unsplash_response.data.results;
        imageList.push(
          responseImages[Math.floor(Math.random() * responseImages.length)]
        );
      }
      setLoading(false);
      setImages(imageList);
    } catch (error) {
      setLoading(false);
      if (error.response) {
        // Server-side error (FastAPI returned an error)
        console.error("Server Error:", error.response.data.detail);
        setError("Server Error: Unable to generate images. Please try again!");
      } else if (error.request) {
        // No response was received
        console.error("Network Error: No response from server", error.request);
        setError("Network Error: No response from server. Please try again!");
      } else {
        // Other client-side errors
        console.error("Error:", error.message);
        setError("Client Error: Unable to generate images. Please try again!");
      }
    }
  }

  async function handleDownloadImage(image) {
    try {
      // Triggering a request to unsplash to download the image
      await axios.get(image.links.download_location, {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      });

      const imageResponse = await fetch(image.urls.full);
      const imageBlob = await imageResponse.blob();
      const imageURL = URL.createObjectURL(imageBlob);

      // Saving the image locally
      const link = document.createElement("a");
      link.href = imageURL;
      link.setAttribute("download", `${image.slug}.jpg`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("Error downloading image: ", err);
    }
  }
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px",
        }}
      >
        <TextField
          variant="outlined"
          label="Blog Content"
          margin="normal"
          multiline
          rows={10}
          sx={{ width: "60%" }}
          onChange={handleChangeContent}
          value={content}
          error={!!validationMessage}
          helperText={validationMessage}
        ></TextField>
        <Button
          type="submit"
          variant="contained"
          startIcon={<AutoAwesome></AutoAwesome>}
          size="large"
          sx={{
            marginTop: "16px",
            width: "60%",
            background: "#7012DA",
          }}
          onClick={handleFormSubmit}
        >
          {loading ? "Generating..." : "Generate"}
        </Button>
        {loading && <CircularProgress style={{ marginTop: "16px" }} />}
        <Typography variant="h6" color="error" marginTop="16px">
          {error}
        </Typography>
      </Box>
      {images && (
        <ImageList
          images={images}
          onDialogOpen={handleDialogOpen}
          onDialogClose={handleDialogClose}
        ></ImageList>
      )}
      <Dialog
        open={isOpen}
        onClose={handleDialogClose}
        fullWidth
        PaperProps={{
          style: {
            height: "auto",
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle>
          <Close
            className="clickable"
            onClick={handleDialogClose}
            style={{ float: "right", color: "#7012DA" }}
          ></Close>
        </DialogTitle>
        <DialogContent
          style={{
            display: "flex",
            justifyContent: "center",
            alignContent: "center",
            height: "100%",
            maxHeight: "80vh",
            overflow: "hidden",
          }}
        >
          {selectedImage && (
            <img
              src={selectedImage.urls.regular}
              alt={selectedImage.alt_description}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            ></img>
          )}
        </DialogContent>
        <DialogActions style={{ padding: "16px 24px" }}>
          <Button
            style={{ background: "#7012DA" }}
            variant="contained"
            startIcon={<Download></Download>}
            onClick={() => handleDownloadImage(selectedImage)}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function ImageList({ images, onDialogOpen }) {
  return (
    <>
      <Box
        sx={{
          padding: "16px",
          marginTop: "32px",
          display: "flex",
          justifyContent: "space-evenly",
        }}
      >
        {images.map((image, index) => (
          <Image key={index} image={image} onDialogOpen={onDialogOpen} />
        ))}
      </Box>
    </>
  );
}

function Image({ image, onDialogOpen }) {
  return (
    <img
      className="clickable"
      src={image.urls.thumb}
      alt={image.alt_description}
      style={{
        height: "200px",
        width: "200px",
        objectFit: "cover",
        borderRadius: "8px",
      }}
      onClick={() => onDialogOpen(image)}
    ></img>
  );
}

export default App;
