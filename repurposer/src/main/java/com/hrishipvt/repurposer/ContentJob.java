package com.hrishipvt.repurposer;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "content_jobs")
@Getter
@Setter
@NoArgsConstructor
public class ContentJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String transcript;

    @Column(columnDefinition = "TEXT")
    private String reelCaption;

    @Column(columnDefinition = "TEXT")
    private String linkedinPost;

    @Column(columnDefinition = "TEXT")
    private String xThread;

    @Column(columnDefinition = "TEXT")
    private String youtubeDescription;

    @Column(columnDefinition = "TEXT")
    private String hashtags;

    private Integer hookScore;

    @Column(columnDefinition = "TEXT")
    private String hookFeedback;

    @Enumerated(EnumType.STRING)
    private JobStatus status = JobStatus.PENDING;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum JobStatus {
        PENDING, COMPLETED, FAILED
    }
}