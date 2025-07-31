package com.agentflow.weather;

import com.agentflow.weather.service.WeatherService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class WeatherServiceTest {
    @Autowired
    private WeatherService weatherService;

    @Test
    void testGetCurrentWeather() {
        String result = weatherService.getCurrentWeather("London");
        assertNotNull(result);
        assertTrue(result.contains("London"));
    }
}
