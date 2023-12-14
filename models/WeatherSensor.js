const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const WeatherSensorSchema = new Schema(
  {
    sensor_id: { type: Number, required: true },
    date: { type: Date, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    wind_speed: { type: Number, required: true },
    pressure: { type: Number },
    precipitation: { type: Number },
    wind_direction: { type: Number },
    solar_radiation: { type: Number },
    uv_index: { type: Number },
    visibility: { type: Number },
    cloud_cover: { type: Number },
  },
  { timestamps: true }
);

WeatherSensorSchema.index({ sensor_id: 1, date: 1 }, { unique: true });

const WeatherSensor = mongoose.model("WeatherSensor", WeatherSensorSchema);

module.exports = WeatherSensor;
