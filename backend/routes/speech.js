const express = require("express");
const multer = require("multer");

const router = express.Router();

// Keep the uploaded audio in memory.
// We don't need to permanently save recordings.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

router.post("/transcribe", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: "No audio file received"
            });
        }

        console.log("Audio received from LumiLex for transcription");

        // Convert the uploaded audio into a Blob
        const audioBlob = new Blob(
            [req.file.buffer],
            {
                type: req.file.mimetype || "audio/webm"
            }
        );

        // Create form data for the Python Whisper server
        const formData = new FormData();

        formData.append(
            "audio",
            audioBlob,
            req.file.originalname || "reading.webm"
        );

        // Optional story context prompt to prime Whisper's decoder for accuracy
        if (req.body && req.body.prompt) {
            formData.append("prompt", req.body.prompt);
        }

        const whisperUrl = process.env.WHISPER_URL || "http://127.0.0.1:8000/transcribe";

        // Send audio to our local Python server
        const whisperResponse = await fetch(
            whisperUrl,
            {
                method: "POST",
                body: formData
            }
        );

        const responseText = await whisperResponse.text();
        let whisperData;
        try {
            whisperData = JSON.parse(responseText);
        } catch {
            throw new Error(`Whisper returned a non-JSON response (HTTP ${whisperResponse.status}). Check that the Python Whisper server is running at ${whisperUrl}.`);
        }

        if (!whisperResponse.ok) {
            return res.status(500).json({
                error: whisperData.error || "Whisper transcription failed"
            });
        }

        console.log("Whisper transcription success:", whisperData.text);

        // Send Whisper's result back to LumiLex
        res.json(whisperData);

    } catch (error) {
        console.error("Speech route error:", error);

        res.status(500).json({
            error: "Speech transcription failed",
            details: error.message
        });
    }
});

module.exports = router;