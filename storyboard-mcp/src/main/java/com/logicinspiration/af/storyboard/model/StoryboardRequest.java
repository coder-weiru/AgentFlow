package com.logicinspiration.af.storyboard.model;

public record StoryboardRequest(
        String instructions,
        Integer maxSteps
) {}