package com.logicinspiration.af.storyboard.service;


import com.logicinspiration.af.storyboard.model.StoryboardStep;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiImageModel;
import org.springframework.ai.image.ImagePrompt;
import org.springframework.ai.image.ImageResponse;
import org.springframework.stereotype.Service;
import java.util.Base64;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StoryboardService {

    @Nonnull
    private final ChatClient chatClient;

    @Nonnull
    private final OpenAiImageModel openAiImageModel;


    @McpTool(
            name = "generate-storyboard",
            description = "Generate cartoon storyboard panels (base64 images) from installation instructions"
    )
    public List<StoryboardStep> generateStoryboard(
            @McpToolParam(
                    description = "Full instructions text (manual or steps)",
                    required = true) String instructions,
            @McpToolParam(
                    description = "Maximum number of steps to illustrate",
                    required = false) Integer maxSteps) {

        int limit = (maxSteps == null || maxSteps <= 0) ? 10 : maxSteps;

        // 1) Ask LLM to extract clean steps + prompts as JSON
        String systemPrompt = """
                You are a technical illustrator.
                1. Read the instructions.
                2. Break them into at most %d clear numbered steps.
                3. For each step, return JSON with: stepNumber, title, caption,
                   and a short English DALL·E-style prompt for a monochrome
                   instructional cartoon (no color, white background).
                """.formatted(limit);

        ChatResponse stepResponse = chatClient.prompt(new Prompt(
                List.of(
                        SystemMessage.builder().text(systemPrompt).build(),
                        UserMessage.builder().text(instructions).build()
                ))).call().chatResponse();

        // Assume the model returns a JSON array we can parse via Jackson/etc.
        // To keep the sample short, imagine we already parsed it:
        List<Map<String, Object>> parsedSteps = /* parse stepResponse.getResult().getOutputText() */ new ArrayList<>();

        List<StoryboardStep> result = new ArrayList<>();
        for (Map<String, Object> s : parsedSteps) {
            int stepNumber = (int) s.get("stepNumber");
            String title = (String) s.get("title");
            String caption = (String) s.get("caption");
            String imagePrompt = (String) s.get("imagePrompt");

            // 2) Generate image for each step
            ImageResponse imgResp = openAiImageModel.call(new ImagePrompt(imagePrompt));
            String base64 = imgResp.getResult().getOutput().getB64Json();

            // you might want to ensure it's plain base64, not data URL:
            String cleanedBase64 = Base64.getEncoder().encodeToString(
                    Base64.getDecoder().decode(base64)); // normalize

            result.add(new StoryboardStep(stepNumber, title, caption, imagePrompt, cleanedBase64));
        }

        return result;
    }
}
