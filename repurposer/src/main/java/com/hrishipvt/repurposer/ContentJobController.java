package com.hrishipvt.repurposer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/jobs")
public class ContentJobController {

    private final ContentJobRepository repository;
    private final GeminiService geminiService;

    public ContentJobController(ContentJobRepository repository, GeminiService geminiService) {
        this.repository = repository;
        this.geminiService = geminiService;
    }

    @PostMapping
    public ResponseEntity<ContentJob> createJob(@RequestBody Map<String, String> body) {
        String transcript = body.get("transcript");

        ContentJob job = new ContentJob();
        job.setTranscript(transcript);

        try {
            Map<String, Object> result = geminiService.generateContentPackage(transcript);

            job.setReelCaption((String) result.get("reelCaption"));
            job.setLinkedinPost((String) result.get("linkedinPost"));
            job.setXThread((String) result.get("xThread"));
            job.setYoutubeDescription((String) result.get("youtubeDescription"));
            job.setHashtags((String) result.get("hashtags"));
            job.setHookScore(toInt(result.get("hookScore")));
            job.setHookFeedback((String) result.get("hookFeedback"));
            job.setStatus(ContentJob.JobStatus.COMPLETED);
        } catch (Exception e) {
            e.printStackTrace();
            job.setStatus(ContentJob.JobStatus.FAILED);
        }

        ContentJob saved = repository.save(job);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/regenerate/{field}")
    public ResponseEntity<ContentJob> regenerateField(@PathVariable Long id, @PathVariable String field) {
        Optional<ContentJob> jobOpt = repository.findById(id);

        if (jobOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ContentJob job = jobOpt.get();

        try {
            String generated = geminiService.generate(buildPrompt(field, job.getTranscript()));
            applyField(job, field, generated);

            if (field.equals("reelCaption")) {
                Map<String, Object> scoreResult = geminiService.scoreHook(generated);
                job.setHookScore(toInt(scoreResult.get("hookScore")));
                job.setHookFeedback((String) scoreResult.get("hookFeedback"));
            }

            ContentJob saved = repository.save(job);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public List<ContentJob> getAllJobs() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContentJob> getJob(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private Integer toInt(Object value) {
        if (value == null) return null;
        if (value instanceof Integer i) return i;
        if (value instanceof Number n) return n.intValue();
        return Integer.parseInt(value.toString());
    }

    private String buildPrompt(String field, String transcript) {
        return switch (field) {
            case "reelCaption" -> "Write a short, catchy Instagram Reel caption (max 2 lines, with 1-2 emojis) based on this video transcript:\n\n" + transcript;
            case "linkedinPost" -> "Write a professional LinkedIn post (3-5 short paragraphs) summarizing the key insight from this video transcript:\n\n" + transcript;
            case "xThread" -> "Write a Twitter/X thread (5-7 tweets, numbered) breaking down this video transcript into a punchy narrative:\n\n" + transcript;
            case "youtubeDescription" -> "Write a YouTube video description (2-3 paragraphs, SEO-friendly) based on this transcript:\n\n" + transcript;
            case "hashtags" -> "Generate 15 relevant hashtags (space-separated, no numbering) for a social media post based on this video transcript:\n\n" + transcript;
            default -> throw new IllegalArgumentException("Unknown field: " + field);
        };
    }

    private void applyField(ContentJob job, String field, String value) {
        switch (field) {
            case "reelCaption" -> job.setReelCaption(value);
            case "linkedinPost" -> job.setLinkedinPost(value);
            case "xThread" -> job.setXThread(value);
            case "youtubeDescription" -> job.setYoutubeDescription(value);
            case "hashtags" -> job.setHashtags(value);
            default -> throw new IllegalArgumentException("Unknown field: " + field);
        }
    }
}