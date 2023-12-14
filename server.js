const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./database");
const WeatherSensor = require("./models/WeatherSensor");

const app = express();
const port = process.env.PORT || 3001;

if (process.env.NODE_ENV !== "test") {
  connectDB();
}

app.use(bodyParser.json());

app.post("/sensor", async (req, res) => {
  try {
    if (!Number.isInteger(req.body.sensor_id) || req.body.sensor_id < 0) {
      return res
        .status(400)
        .json({ message: "Invalid sensor_id, must be a positive integer." });
    }

    if (isNaN(new Date(req.body.date).getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    if (
      typeof req.body.temperature !== "number" ||
      req.body.temperature < -50 ||
      req.body.temperature > 50
    ) {
      return res.status(400).json({
        message: "Invalid temperature, must be a number between -50 and 50.",
      });
    }

    if (
      typeof req.body.humidity !== "number" ||
      req.body.humidity < 0 ||
      req.body.humidity > 100
    ) {
      return res.status(400).json({
        message: "Invalid humidity, must be a number between 0 and 100.",
      });
    }

    if (typeof req.body.wind_speed !== "number" || req.body.wind_speed < 0) {
      return res.status(400).json({
        message: "Invalid wind_speed, must be a non-negative number.",
      });
    }

    if (
      req.body.pressure !== undefined &&
      (typeof req.body.pressure !== "number" ||
        req.body.pressure < 800 ||
        req.body.pressure > 1100)
    ) {
      return res.status(400).json({
        message: "Invalid pressure, must be a number between 800 and 1100.",
      });
    }

    if (
      req.body.precipitation !== undefined &&
      (typeof req.body.precipitation !== "number" || req.body.precipitation < 0)
    ) {
      return res.status(400).json({
        message: "Invalid precipitation, must be a non-negative number.",
      });
    }

    if (
      req.body.wind_direction !== undefined &&
      (typeof req.body.wind_direction !== "number" ||
        req.body.wind_direction < 0 ||
        req.body.wind_direction > 360)
    ) {
      return res.status(400).json({
        message: "Invalid wind direction, must be a number between 0 and 360.",
      });
    }

    if (
      req.body.solar_radiation !== undefined &&
      (typeof req.body.solar_radiation !== "number" ||
        req.body.solar_radiation < 0)
    ) {
      return res.status(400).json({
        message: "Invalid solar radiation, must be a non-negative number.",
      });
    }

    if (
      req.body.uv_index !== undefined &&
      (typeof req.body.uv_index !== "number" ||
        req.body.uv_index < 0 ||
        req.body.uv_index > 11)
    ) {
      return res.status(400).json({
        message: "Invalid UV index, must be a number between 0 and 11.",
      });
    }

    if (
      req.body.visibility !== undefined &&
      (typeof req.body.visibility !== "number" || req.body.visibility < 0)
    ) {
      return res.status(400).json({
        message: "Invalid visibility, must be a non-negative number.",
      });
    }

    if (
      req.body.cloud_cover !== undefined &&
      (typeof req.body.cloud_cover !== "number" ||
        req.body.cloud_cover < 0 ||
        req.body.cloud_cover > 100)
    ) {
      return res.status(400).json({
        message: "Invalid cloud cover, must be a number between 0 and 100.",
      });
    }

    const newSensorData = new WeatherSensor({
      sensor_id: req.body.sensor_id,
      date: new Date(req.body.date),
      temperature: req.body.temperature,
      humidity: req.body.humidity,
      wind_speed: req.body.wind_speed,
      pressure: req.body.pressure,
      precipitation: req.body.precipitation,
      wind_direction: req.body.wind_direction,
      solar_radiation: req.body.solar_radiation,
      uv_index: req.body.uv_index,
      visibility: req.body.visibility,
      cloud_cover: req.body.cloud_cover,
    });

    const data = await newSensorData.save();
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ message: "Error saving sensor data", error: err.message });
  }
});

function buildStatsAggregation(query, metrics, statistic) {
  const matchStage = { $match: query };
  const groupStage = {
    $group: {
      _id: "$sensor_id",
    },
  };

  metrics.forEach((metric) => {
    if (statistic === "min") {
      groupStage.$group[metric + "_min"] = { $min: `$${metric}` };
    } else if (statistic === "max") {
      groupStage.$group[metric + "_max"] = { $max: `$${metric}` };
    } else if (statistic === "sum") {
      groupStage.$group[metric + "_sum"] = { $sum: `$${metric}` };
    } else if (statistic === "average") {
      groupStage.$group[metric + "_average"] = { $avg: `$${metric}` };
    }
  });

  return [matchStage, groupStage];
}

app.get("/sensor", async (req, res) => {
  try {
    const {
      sensor_id,
      startDate,
      endDate,
      metrics,
      statistic,
      temperature,
      humidity,
      wind_speed,
      pressure,
      precipitation,
      wind_direction,
      solar_radiation,
      uv_index,
      visibility,
      cloud_cover,
    } = req.query;

    let query = {};
    if (sensor_id) {
      if (!Number.isInteger(parseInt(sensor_id))) {
        return res
          .status(400)
          .json({ message: "Invalid sensor_id, must be an integer." });
      }
      query.sensor_id = parseInt(sensor_id);
    }

    if (startDate || endDate) {
      if (
        (startDate && isNaN(new Date(startDate).getTime())) ||
        (endDate && isNaN(new Date(endDate).getTime()))
      ) {
        return res.status(400).json({ message: "Invalid date format." });
      }
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (temperature !== undefined) {
      const tempValue = parseFloat(temperature);
      if (isNaN(tempValue)) {
        return res
          .status(400)
          .json({ message: "Invalid temperature, must be a number." });
      }
      query.temperature = { $gte: tempValue };
    }

    if (humidity !== undefined) {
      const humidityValue = parseFloat(humidity);
      if (isNaN(humidityValue) || humidityValue < 0 || humidityValue > 100) {
        return res.status(400).json({
          message: "Invalid humidity, must be a number between 0 and 100.",
        });
      }
      query.humidity = { $gte: humidityValue };
    }

    if (wind_speed !== undefined) {
      const windSpeedValue = parseFloat(wind_speed);
      if (isNaN(windSpeedValue) || windSpeedValue < 0) {
        return res.status(400).json({
          message: "Invalid wind_speed, must be a non-negative number.",
        });
      }
      query.wind_speed = { $gte: windSpeedValue };
    }

    if (pressure !== undefined) {
      const pressureValue = parseFloat(pressureValue);
      if (isNaN(pressureValue) || pressureValue < 800 || pressureValue > 1100) {
        return res.status(400).json({
          message: "Invalid pressure, must be a number between 800 and 1100.",
        });
      }
      query.pressure = { $gte: pressureValue };
    }

    if (precipitation !== undefined) {
      const precipitationValue = parseFloat(precipitationValue);
      if (isNaN(precipitationValue) || precipitationValue < 0) {
        return res.status(400).json({
          message: "Invalid precipitation, must be a non-negative number",
        });
      }
      query.precipitation = { $gte: precipitationValue };
    }

    if (wind_direction !== undefined) {
      const windDirectionValue = parseFloat(windDirectionValue);
      if (
        isNaN(windDirectionValue) ||
        windDirectionValue < 0 ||
        windDirectionValue > 360
      ) {
        return res.status(400).json({
          message:
            "Invalid wind direction, must be a number between 0 and 360.",
        });
      }
      query.wind_direction = { $gte: windDirectionValue };
    }

    if (solar_radiation !== undefined) {
      const solarRadiationValue = parseFloat(solarRadiationValue);
      if (isNaN(solarRadiationValue) || solarRadiationValue < 0) {
        return res.status(400).json({
          message: "Invalid solar radiation, must be a non-negative number.",
        });
      }
      query.solar_radiation = { $gte: solarRadiationValue };
    }

    if (uv_index !== undefined) {
      const uvIndexValue = parseFloat(uvIndexValue);
      if (isNaN(uvIndexValue) || uvIndexValue < 0 || uvIndexValue > 11) {
        return res.status(400).json({
          message: "Invalid UV index, must be a number between 0 and 11.",
        });
      }
      query.uv_index = { $gte: uvIndexValue };
    }

    if (visibility !== undefined) {
      const visibilityValue = parseFloat(visibilityValue);
      if (isNaN(visibilityValue) || visibilityValue < 0) {
        return res.status(400).json({
          message: "Invalid visibility, must be a non-negative number.",
        });
      }
      query.visibility = { $gte: visibilityValue };
    }

    if (cloud_cover !== undefined) {
      const cloudCoverValue = parseFloat(cloudCoverValue);
      if (
        isNaN(cloudCoverValue) ||
        cloudCoverValue < 0 ||
        cloudCoverValue > 100
      ) {
        return res.status(400).json({
          message: "Invalid cloud cover, must be a number between 0 and 100.",
        });
      }
      query.cloud_cover = { $gte: cloudCoverValue };
    }

    let sensorsData;
    if (metrics && statistic) {
      const metricsArray = metrics.split(",");
      const pipeline = buildStatsAggregation(query, metricsArray, statistic);
      sensorsData = await WeatherSensor.aggregate(pipeline);
    } else {
      sensorsData = await WeatherSensor.find(query);
    }

    res.status(200).json(sensorsData);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error retrieving sensor data", error: err.message });
  }
});

module.exports = app;
