package com.logicinspiration.af.storyboard.model;

public record StoryboardStep(
        int stepNumber,
        String title,
        String caption,
        String prompt,
        String imageBase64
) {}