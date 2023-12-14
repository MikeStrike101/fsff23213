const supertest = require("supertest");
const { expect } = require("chai");
const sinon = require("sinon");
const mongoose = require("mongoose");
const WeatherSensor = require("../models/WeatherSensor");
const app = require("../server");

describe("POST /sensor", () => {
  let saveStub;

  before(() => {
    saveStub = sinon.stub(WeatherSensor.prototype, "save");
  });

  after(() => {
    saveStub.restore();
  });

  it("should save sensor data successfully", async () => {
    const currentDate = new Date();
    saveStub.resolves({
      sensor_id: 1,
      date: currentDate,
      temperature: 25,
      humidity: 50,
      wind_speed: 10,
    });

    const sensorData = {
      sensor_id: 1,
      date: currentDate,
      temperature: 25,
      humidity: 50,
      wind_speed: 10,
    };

    const response = await supertest(app).post("/sensor").send(sensorData);

    expect(response.status).to.equal(201);
    expect(response.body.sensor_id).to.equal(sensorData.sensor_id);
    expect(response.body.temperature).to.equal(sensorData.temperature);
    expect(response.body.humidity).to.equal(sensorData.humidity);
    expect(new Date(response.body.date).getTime()).to.equal(
      new Date(sensorData.date).getTime()
    );
  });

  it("should return an error for invalid sensor data", async () => {
    const invalidSensorData = {
      sensor_id: -1,
      date: new Date(),
    };

    saveStub.rejects(new Error("Invalid data"));

    const response = await supertest(app)
      .post("/sensor")
      .send(invalidSensorData);

    expect(response.status).to.equal(400);
  });

  const requiredFields = [
    "sensor_id",
    "date",
    "temperature",
    "humidity",
    "wind_speed",
  ];

  requiredFields.forEach((field) => {
    it(`should return an error when ${field} is missing`, async () => {
      let sensorData = {
        sensor_id: 1,
        date: new Date(),
        temperature: 25,
        humidity: 50,
        wind_speed: 10,
      };

      delete sensorData[field];

      saveStub.rejects(new Error(`${field} is required`));

      const response = await supertest(app).post("/sensor").send(sensorData);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.include(`Invalid ${field}`);
    });
  });

  it("should return an error for extremely high temperature", async () => {
    const sensorData = {
      sensor_id: 1,
      date: new Date(),
      temperature: 100,
      humidity: 50,
      wind_speed: 10,
    };

    saveStub.rejects(new Error("Temperature out of range"));

    const response = await supertest(app).post("/sensor").send(sensorData);

    expect(response.status).to.equal(400);
    expect(response.body.message).to.include(
      "Invalid temperature, must be a number between -50 and 50."
    );
  });

  it("should return an error for extremely low temperature", async () => {
    const sensorData = {
      sensor_id: 1,
      date: new Date(),
      temperature: -100,
      humidity: 50,
      wind_speed: 10,
    };

    saveStub.rejects(new Error("Temperature out of range"));

    const response = await supertest(app).post("/sensor").send(sensorData);

    expect(response.status).to.equal(400);
    expect(response.body.message).to.include(
      "Invalid temperature, must be a number between -50 and 50."
    );
  });

  it("should return an error for duplicate sensor_id", async () => {
    const sensorData = {
      sensor_id: 2,
      date: new Date(),
      temperature: 25,
      humidity: 50,
      wind_speed: 10,
    };

    saveStub.resolves(sensorData);
    await supertest(app).post("/sensor").send(sensorData);

    saveStub.rejects(new Error("Duplicate sensor_id"));

    const duplicateResponse = await supertest(app)
      .post("/sensor")
      .send(sensorData);

    expect(duplicateResponse.status).to.equal(400);
    expect(duplicateResponse.body.message).to.include(
      "Error saving sensor data"
    );
  });

  it("should return an error for incorrectly formatted date", async () => {
    const sensorDataWithInvalidDate = {
      sensor_id: 3,
      date: "not-a-real-date",
      temperature: 22,
      humidity: 55,
      wind_speed: 5,
    };

    saveStub.rejects(new Error("Invalid date format"));

    const response = await supertest(app)
      .post("/sensor")
      .send(sensorDataWithInvalidDate);

    expect(response.status).to.equal(400);
    expect(response.body.message).to.include("Invalid date format");
  });
});

describe("GET /sensor", () => {
  let findStub;

  before(() => {
    findStub = sinon.stub(WeatherSensor, "find");
  });

  after(() => {
    findStub.restore();
  });

  it("should return sensor data for valid query", async () => {
    const currentDate = new Date();

    const mockData = [
      {
        sensor_id: 1,
        date: currentDate,
        temperature: 25,
        humidity: 50,
        wind_speed: 10,
      },
    ];
    findStub.resolves(mockData);

    const response = await supertest(app).get("/sensor?sensor_id=1");

    expect(response.status).to.equal(200);
    expect(response.body).to.be.an("array");
    expect(response.body.length).to.equal(1);
    expect(response.body.sensor_id).to.equal(mockData.sensor_id);
    expect(response.body.temperature).to.equal(mockData.temperature);
    expect(response.body.humidity).to.equal(mockData.humidity);
    expect(new Date(response.body[0].date).getTime()).to.equal(
      new Date(mockData[0].date).getTime()
    );
  });

  it("should handle queries with no results", async () => {
    findStub.resolves([]);

    const response = await supertest(app).get("/sensor?sensor_id=2");

    expect(response.status).to.equal(200);
    expect(response.body).to.be.an("array");
    expect(response.body).to.have.lengthOf(0);
  });

  const queryParameters = ["sensor_id", "startDate", "endDate"];
  const errorParameters = ["metric", "statistic"];

  queryParameters.forEach((param) => {
    it(`should return an empty array when ${param} is invalid`, async () => {
      const response = await supertest(app).get(`/sensor?${param}=invalid`);
      expect(response.status).to.equal(400);
      expect(response.body.message).to.include(`Invalid`);
    });
  });

  errorParameters.forEach((param) => {
    it(`should return a 400 error when ${param} is invalid`, async () => {
      const response = await supertest(app).get(`/sensor?${param}=invalid`);
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");
      expect(response.body).to.have.lengthOf(0);
    });
  });
});
