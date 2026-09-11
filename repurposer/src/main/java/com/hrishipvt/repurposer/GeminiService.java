package com.hrishipvt.repurposer;


import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String generate(String prompt) {
        String text = callGemini(prompt, false);
        return text;
    }

    public Map<String, Object> generateContentPackage(String transcript) {
        String prompt = """
                You are a social media content assistant. Based on the video transcript below, \
                generate a JSON object with exactly these keys: reelCaption, linkedinPost, xThread, \
                youtubeDescription, hashtags, hookScore, hookFeedback.

                - reelCaption: short catchy Instagram Reel caption (max 2 lines, with 1-2 emojis)
                - linkedinPost: professional LinkedIn post (3-5 short paragraphs)
                - xThread: Twitter/X thread (5-7 numbered tweets, separated by blank lines)
                - youtubeDescription: SEO-friendly YouTube description (2-3 paragraphs)
                - hashtags: 15 relevant hashtags, space-separated, no numbering
                - hookScore: an integer 1-10 rating how strong reelCaption is as a scroll-stopping hook
                - hookFeedback: one or two sentences of specific, actionable feedback on how to make the hook stronger

                Return ONLY valid JSON. No markdown formatting, no code fences, no extra text.

                Transcript:
                %s
                """.formatted(transcript);

        String jsonText = callGemini(prompt, true);

        try {
            return objectMapper.readValue(jsonText, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini JSON response: " + jsonText, e);
        }
    }

    public Map<String, Object> scoreHook(String reelCaption) {
        String prompt = """
                Rate how strong this Instagram Reel caption is as a scroll-stopping hook, on a scale of 1-10. \
                Return ONLY a JSON object with keys "hookScore" (integer) and "hookFeedback" (one or two sentences \
                of specific, actionable feedback). No markdown, no extra text.

                Caption:
                %s
                """.formatted(reelCaption);

        String jsonText = callGemini(prompt, true);

        try {
            return objectMapper.readValue(jsonText, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini JSON response: " + jsonText, e);
        }
    }

    private String callGemini(String prompt, boolean asJson) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        Map<String, Object> body;
        if (asJson) {
            body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of("responseMimeType", "application/json")
            );
        } else {
            body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
            );
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        Map<String, Object> response = restTemplate.postForObject(apiUrl, request, Map.class);

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        return (String) parts.get(0).get("text");
    }
}