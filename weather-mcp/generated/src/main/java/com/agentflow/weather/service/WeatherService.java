package com.agentflow.weather.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class WeatherService {
    @Value("${openweather.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getCurrentWeather(String city) {
        String url = String.format(
                "https://api.openweathermap.org/data/2.5/weather?q=%s&appid=%s&units=metric",
                city, apiKey);
        return restTemplate.getForObject(url, String.class);
    }
}
