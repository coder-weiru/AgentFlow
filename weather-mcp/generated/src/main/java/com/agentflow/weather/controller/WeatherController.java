package com.agentflow.weather.controller;

import com.agentflow.weather.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {
    @Autowired
    private WeatherService weatherService;

    @GetMapping
    public String getCurrentWeather(@RequestParam String city) {
        return weatherService.getCurrentWeather(city);
    }
}
