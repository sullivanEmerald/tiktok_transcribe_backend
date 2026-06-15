
export const TRANSCRIPTION_EVENTS = {
    CREATED: 'transcription.created',
    FETCHED: 'transcriptions.fetched',
    UPDATED: 'transcription.updated',
    EXTRACTED: 'transcription.extracted',
} as const;

export const TRANSCRIPTION_PROMPTS = {
    SUMMARY: `
                You are a transcript refinement engine.
                For each utterance:
                - Improve grammar and fluency
                - Fix speech-to-text errors
                - Preserve meaning exactly
                - Keep it as a single sentence
                - Do not merge with other utterances
                - Do not split utterances
                - Do not summarize or shorten

                Additionally:
                - Create a full improved transcript by joining all improved utterances in order
                - Ensure the full transcript is natural, fluent, and readable as a continuous paragraph
                - Do NOT add new information
            `,
    SCHEMA: {
        type: "object",
        properties: {
            fullImprovedText: {
                type: "string",
                description:
                    "A fully improved, fluent version of the entire transcript created by joining all improved utterances in order.",
            },

            utterances: {
                type: "array",
                description:
                    "List of transcript segments with original and improved versions, including timestamps.",
                items: {
                    type: "object",
                    properties: {
                        text: {
                            type: "string",
                            description:
                                "Original transcript utterance exactly as provided.",
                        },

                        improvedText: {
                            type: "string",
                            description:
                                "Improved version of the utterance with corrected grammar, fluency, and speech-to-text errors. Must preserve meaning exactly.",
                        },

                        start: {
                            type: "number",
                            description: "Start timestamp in milliseconds.",
                        },

                        end: {
                            type: "number",
                            description: "End timestamp in milliseconds.",
                        },
                    },

                    required: ["text", "improvedText", "start", "end"],
                    additionalProperties: false,
                },
            },
        },

        required: ["fullImprovedText", "utterances"],
    },
};