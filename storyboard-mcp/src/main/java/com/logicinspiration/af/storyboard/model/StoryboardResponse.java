package com.logicinspiration.af.storyboard.model;

import java.util.List;

public record StoryboardResponse(
        List<StoryboardStep> steps
) {}
